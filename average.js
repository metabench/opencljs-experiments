//var POpenCL = require('./cpp/build/release/ocl.node').MyObject;

var POpenCL = require('./popencl');
var smalloc = require('smalloc');
var jsgui = require('../../ws/js/core/jsgui-lang-essentials');
var each = jsgui.eac;

var mod_write_kernel = require('./write-kernel');

var write_counted_reduction_kernel = mod_write_kernel.write_counted_reduction_kernel;
var write_counted_output_reduction_kernel = mod_write_kernel.write_counted_output_reduction_kernel;
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
}
var time_diff = process.hrtime(start_time);
// 17, reduced by a factor of 128 would go to 1
console.log('JavaScript init data time: ', time_diff);

var k3s;

// Counted reduction / weighted reduction
// -----------------
// Counted reduction probably is a better name for the reduction process. Weighting is used for averages.

// Could also have a quicker way of writing the counted functions / a generalization for all of them.


// could have a shorthand for writing a counted reduction kernel.
//  maybe specify both functions next to each other.

// write_counted_reduction_kernel
// write_counted_output_reduction_kernel

// For a reduce function, there will be less choice about types.
//  The counts stay as Uint32Array
//  Will have choice of the data type.
//

// Maybe want some kind of a template for this function too
//  How it knows the processed_input_count.


// We could run it on the version with the input counts, but where it takes one.
//  or we could have the code remove some code???

// I think leave it, for the moment.


// This kind of reduce function could be expressed simply too.

var k_weighted_output_reduce_average = write_counted_output_reduction_kernel('weighted_output_reduce_average',
  Float32Array, reduction_factor,
  /* prepare    */ `double total = 0;`,
  /* repeat     */ `total += val;`,
  /* conclude   */ `return total / processed_input_count;`
);

console.log('k_weighted_output_reduce_average', k_weighted_output_reduce_average);


var k_weighted_reduce_average = write_counted_reduction_kernel('weighted_reduce_average',
  Float32Array, reduction_factor,
  /* prepare    */ `double accumulated_mean = 0;`,
  /* repeat     */ `accumulated_mean += val * val_input_count / processed_input_count;`,
  /* conclude   */ `return accumulated_mean;`);

console.log('k_weighted_reduce_average', k_weighted_reduce_average);


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
  popencl.execute_kernel_all_size_params('weighted_reduce_average', [
    'Res_' + prev_level,
    'Res_' + prev_level + '_input_counts',
    'Res_' + level,
    'Res_' + level + '_input_counts'
  ]);
  level++;
}


time_diff = process.hrtime(start_time);
//popencl.vector_add(a, b, res);
//popencl.execute_kernel(['A', 'B'], ['Res']);

//popencl.get_buffer('Res_0', stage_results[0]);
//popencl.get_buffer('Res_0_input_counts', stage_input_count_buffers[0]);
//popencl.get_buffer('Res_1', stage_results[1]);
//popencl.get_buffer('Res_1_input_counts', stage_input_count_buffers[1]);


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
