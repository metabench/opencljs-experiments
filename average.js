var POpenCL = require('./cpp/build/release/ocl.node').MyObject;
var smalloc = require('smalloc');
var jsgui = require('../../ws/js/core/jsgui-lang-essentials');
var each = jsgui.eac;

var mod_write_kernel = require('./write-kernel');
var write_kernel_all_size_params = mod_write_kernel.write_kernel_all_size_params;
var write_kernel = mod_write_kernel.write_kernel;

var size = 120000000;

//var size = 1000;
// 21829262
// 51286125
//var size = 16;

var reduction_factor = 8;
console.log('initializing data');

var a = smalloc.alloc(size, smalloc.Types.Float);
var c;
var start_time = process.hrtime();
for (c = 0; c < size; c++) {
    //a[c] = c * 4 + 1;

    //if (c % 16 === 0) {
    //  a[c] = c * 4;
    //} else {
    //  a[c] = c ^ 2;
    //}

    a[c] = c * 20 - Math.random() * 50000;
    //a[c] = c * 20282;
    //a[c] = c * 14000 - (c * 3) ^ 2 ;

    //b[c] = c * 2;
    //res[c] = 0;
}
var time_diff = process.hrtime(start_time);
// 17, reduced by a factor of 128 would go to 1
console.log('JavaScript init data time: ', time_diff);

var k3s;

// Counted reduction.



var k_weighted_reduce_average = write_kernel_all_size_params('weighted_reduce_average',
  [['a', Float32Array], ['a_counts', Uint32Array],
  ['res', Float32Array], ['input_counts', Uint32Array]], `

  double total = 0;
  int processed_input_count = 0;
  int p;
  int p2;

  p = id * ` + reduction_factor + `;
  int c;

  for (c = 0; c < ` + reduction_factor + `; c++) {
    p2 = p + c;
    if (p2 < size_a) {
      processed_input_count += a_counts[p2];
    }
  }
  for (c = 0; c < ` + reduction_factor + `; c++) {
    p2 = p + c;
    if (p2 < size_a) {
      total += a[p2] * a_counts[p2] / processed_input_count;
    }
  }
  res[id] = total;
  input_counts[id] = processed_input_count;
`);

// So this would count how many values were included.

// We don't have the counts with the starting item.

var k_weighted_output_reduce_average = write_kernel_all_size_params('weighted_output_reduce_average',
[['a', Float32Array], ['res', Float32Array], ['input_counts', Uint32Array]], `

  double total = 0;
  int processed_input_count = 0;
  int p;
  int p2;
  p = id * ` + reduction_factor + `;

  for (int c = 0; c < ` + reduction_factor + `; c++) {
    p2 = p + c;
    if (p2 < size_a) {
      total += a[p2];
      processed_input_count++;
    }
  }

  res[id] = total / processed_input_count;
  input_counts[id] = processed_input_count;
`);

var k_reduce_16_average = write_kernel_all_size_params('reduce_16_average', [['a', Float32Array], ['res', Float32Array]], `
  //float total = 0;
  float total = 0;
  int c2 = 0;
  int p;
  int p2;
  p = id * ` + reduction_factor + `;

  //int input_size =

  // not sure we know the input size?
  //  but we would know from the odd / non factoring number of inputs?

  // now n is the number of output values.

  // Or do we need to do a different function form / call, with telling it both the output size and the input size.
  //  Perhaps it can find the odd ones though...

  // I think this function needs to be given more information to successfully reduce.

  for (int c = 0; c < ` + reduction_factor + `; c++) {
    p2 = p + c;

    if (p2 < size_a) {
      total += a[p2];
      c2++;
    }

    //if (2 < n) {
    //  total += a[p2];
    //  c2++;
    //}

  }
  //res[id] = c2;
  //res[id] = total / ` + reduction_factor + `;
  res[id] = total / c2;
`);



k3s = write_kernel('reduce_16_average', [['a', Float32Array]], ['res', Float32Array], `
  //float total = 0;
  float total = 0;
  //int p;
  //for (int c = 0; c < ` + reduction_factor + `; c++) {
  //  p = id * ` + reduction_factor + `;
  //  total += a[p + c];
  //}
  res[id] = 5;
  //res[id] = total / ` + reduction_factor + `;
`);

var kernelSource = k_weighted_output_reduce_average;

var popencl = new POpenCL();

var stage_size = size;
var stage_reduced_size;


var n_stage = 0;
var stage_sizes = [];
var stage_results = [];
var stage_input_count_buffers = [];

stage_sizes.push(size);
popencl.add_buffer('A', size);


while (stage_size > 1) {
  stage_reduced_size = Math.ceil(stage_size / reduction_factor);
  console.log('stage_reduced_size', stage_reduced_size);

  stage_results.push(smalloc.alloc(stage_reduced_size, smalloc.Types.Float));
  stage_input_count_buffers.push(smalloc.alloc(stage_reduced_size, smalloc.Types.Uint32));

  console.log('n_stage', n_stage);

  popencl.add_buffer('Res_' + n_stage, stage_reduced_size);
  popencl.add_buffer('Res_' + n_stage + '_input_counts', stage_reduced_size);

  stage_size = stage_reduced_size;
  n_stage++;
}
n_stage--;

popencl.add_kernel('weighted_output_reduce_average', kernelSource);
popencl.add_kernel('weighted_reduce_average', k_weighted_reduce_average);

// Let's set the first two buffers.
popencl.set_buffer('A', a);

start_time = process.hrtime();
// First reduction, factor of 128, but it's not necessary to have the full 128 items, or have a number of items that's divisible by 128.

popencl.execute_kernel_all_size_params('weighted_output_reduce_average', ['A', 'Res_0', 'Res_0_input_counts']);

var level = 1;

while (level <= n_stage) {
  var prev_level = level - 1;
  popencl.execute_kernel_all_size_params('weighted_reduce_average', ['Res_' + prev_level, 'Res_' + prev_level + '_input_counts', 'Res_' + level, 'Res_' + level + '_input_counts']);
  level++;
}


time_diff = process.hrtime(start_time);
//popencl.vector_add(a, b, res);
//popencl.execute_kernel(['A', 'B'], ['Res']);
popencl.get_buffer('Res_0', stage_results[0]);
popencl.get_buffer('Res_0_input_counts', stage_input_count_buffers[0]);
popencl.get_buffer('Res_1', stage_results[1]);
popencl.get_buffer('Res_1_input_counts', stage_input_count_buffers[1]);


console.log('n_stage', n_stage);
console.log('time_diff', time_diff);

popencl.get_buffer('Res_' + n_stage, stage_results[n_stage]);
popencl.get_buffer('Res_' + n_stage + '_input_counts', stage_input_count_buffers[n_stage]);

var last_res_buffer = stage_results[n_stage];
var last_input_count_buffers = stage_input_count_buffers[n_stage];

console.log('last_res_buffer[0]', last_res_buffer[0]);
console.log('last_input_count_buffers[0]', last_input_count_buffers[0]);

// And deallocate buffers and kernels in popencl.
popencl.release_all();
