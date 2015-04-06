var POpenCL = require('./cpp/build/release/ocl.node').MyObject;
var smalloc = require('smalloc');
var jsgui = require('../../ws/js/core/jsgui-lang-essentials');
var each = jsgui.eac;

var mod_write_kernel = require('./write-kernel');
var write_kernel_all_size_params = mod_write_kernel.write_kernel_all_size_params;
var write_kernel = mod_write_kernel.write_kernel;

//var size = 250000000;

var size = 1000;

//var size = 16;

var reduction_factor = 64;

var a = smalloc.alloc(size, smalloc.Types.Float);
var c;
for (c = 0; c < size; c++) {
    //a[c] = c * 4 + 1;

    //if (c % 16 === 0) {
    //  a[c] = c * 4;
    //} else {
    //  a[c] = c ^ 2;
    //}

    //a[c] = c * 2 * c;
    a[c] = 1;

    //b[c] = c * 2;
    //res[c] = 0;
}

// 17, reduced by a factor of 128 would go to 1


var k3s;

// Could have a counted reduce function.
//  Also sets output buffer showing how many operations took place.

// and this also takes the counts from the input.
// so it needs to be given two buffers to get the values from.

// Some buffers need to be integer, some need to be floating point.

// I think counted data structures would be good for this.
//  Or conventions
//  So that when calculating the total or average, or doing another reduce operation, we keep track of how many input results were processed.


var k_weighted_reduce_128_average = write_kernel_all_size_params('weighted_reduce_128_total', [['a', Float32Array], ['a_counts', Uint32Array], ['res', Float32Array], ['input_counts', Uint32Array]], `


  //float total = 0;
  double total = 0;
  int processed_input_count = 0;
  int p;
  int p2;


  // Each logical item in the input has got two values.

  p = id * ` + reduction_factor + `;

  // could add a weighted amount to the total?
  //  somehow make the calculation more precise.

  //int a_max = size_a / 2;
  //int _2p2;
  int c;

  for (c = 0; c < ` + reduction_factor + `; c++) {
    p2 = p + c;
    //_2p2 = p2 * 2;

    if (p2 < size_a) {

      // Then we act.
      //  I think we may have a structure for a reduce kernel.
      //  So we could do write_reduce_kernel.
      //  We have access to the sizes, and the inner loop.

      total += a[p2];
      processed_input_count += a_counts[p2];
    }

  }
  //res[id * 2] = 3;
  //res[id * 2 + 1] = 3;
  //res[id] = total / 128;


  //res[id * 2] = total;
  //res[id * 2 + 1] = processed_input_count;

  res[id] = total;
  input_counts[id] = processed_input_count;

`);

// So this would count how many values were included.

// We don't have the counts with the starting item.

var k_weighted_output_reduce_128_average = write_kernel_all_size_params('weighted_output_reduce_128_total', [['a', Float32Array], ['res', Float32Array], ['input_counts', Uint32Array]], `


  //float total = 0;
  double total = 0;
  int processed_input_count = 0;
  int p;
  int p2;
  p = id * ` + reduction_factor + `;

  for (int c = 0; c < ` + reduction_factor + `; c++) {
    p2 = p + c;

    if (p2 < size_a) {

      // Then we act.
      //  I think we may have a structure for a reduce kernel.
      //  So we could do write_reduce_kernel.
      //  We have access to the sizes, and the inner loop.


      total += a[p2];
      processed_input_count++;
    }

  }

  res[id] = total;
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

// Kernel that can execute with a different number of results being made to the input data.

// Can try doing a function that applies continually and reduces the amount of data.

// Reduction function.




// Will need to execute the reduction function until we just have 1 data left.

// Will try executing reduction kernel once.





// Averaging numbers...
// Can probably get the averages from groups quickly.
//  Looks like it would need a divide and conquor algorithm.



//console.log('k2s', k2s);

var kernelSource = k_weighted_output_reduce_128_average;

console.log('kernelSource', kernelSource);

// First reduction down to 9...
// Worth calculating the remainder as well.
//  Perhaps in the OpenCL code check to see if we are looking too far ahead / out of the bounds?





// It can't just carry them over when computing the averages.
//  It could do that if the averages had weighting associated too.
//  Saying how many they came from.


// For the moment, restricting averages to the right number of units.
//  May involve some prime factoring?


//  Could do a large number of items that's of the right factor to work conveniently.

// And break up the task for others?

// Possibly queue more kernels, in a different way.
//  The other queueing method may provide more flexibility.





// can have an algorithm to set up the reduction stages.

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






/*




// just have a single
var reduced_1 = Math.ceil(size / reduction_factor);
console.log('reduced_1', reduced_1);



var reduced_2 = Math.ceil(reduced_1 / reduction_factor);
var reduced_3 = Math.ceil(reduced_2 / reduction_factor);
var reduced_4 = Math.ceil(reduced_3 / reduction_factor);
console.log('reduced_3', reduced_3);
*/

//var b = smalloc.alloc(size, smalloc.Types.Float);

// * 2 so it holds weights / counts

/*

var res = smalloc.alloc(reduced_1, smalloc.Types.Float);

// Uint32

var res_input_counts = smalloc.alloc(reduced_1, smalloc.Types.Uint32);

var res2 = smalloc.alloc(reduced_2 * 2, smalloc.Types.Float);
var res3 = smalloc.alloc(reduced_3 * 2, smalloc.Types.Float);
var res4 = smalloc.alloc(reduced_4 * 2, smalloc.Types.Float);

*/

/*
var c;
for (c = 0; c < size; c++) {
    a[c] = c * 4 + 1;
    //b[c] = c * 2;
    //res[c] = 0;
}

*/

// We can give it the kernel.



//popencl.add_buffer('Res2', reduced_2 * 2);
//popencl.add_buffer('Res3', reduced_3 * 2);
//popencl.add_buffer('Res4', reduced_4 * 2);


popencl.add_kernel('weighted_output_reduce_128_total', kernelSource);

popencl.add_kernel('weighted_reduce_128_total', k_weighted_reduce_128_average);

// Let's set the first two buffers.
popencl.set_buffer('A', a);


//popencl.set_buffer('B', b);
// Queue input buffers, single output buffer.
//  Only will be one output buffer I think.
var start_time = process.hrtime();


// First reduction, factor of 128, but it's not necessary to have the full 128 items, or have a number of items that's divisible by 128.

popencl.execute_kernel_all_size_params('weighted_output_reduce_128_total', ['A', 'Res_0', 'Res_0_input_counts']);

var level = 1;

while (level <= n_stage) {
  var prev_level = level - 1;
  popencl.execute_kernel_all_size_params('weighted_reduce_128_total', ['Res_' + prev_level, 'Res_' + prev_level + '_input_counts', 'Res_' + level, 'Res_' + level + '_input_counts']);
  level++;
}





//popencl.execute_kernel_all_size_params('weighted_reduce_128_total', ['Res2'], 'Res3');
//popencl.execute_kernel_all_size_params('weighted_reduce_128_total', ['Res3'], 'Res4');


// weighted_reduce_128_average

//popencl.execute_kernel_all_size_params('reduce_16_average', ['Res'], 'Res2');


// A sequence of kernels could be executing.
// Reducing, doing averages, so each time it gets reduced to 1.

// Repeated reductions.
//  Could have buffers allocated for all stages.
//  Or could probably use just two buffers, working out the results between them.

// A working buffer probably makes the most sense.
// Buffers for the whole calculation would not be so big though.
//  But swapping between them seems nicer?

// 1. Reduce from A to B
// 2. Reduce from B to C
// 3. Reduce from C to B
// 4. Reduce from B to C



// then can we have a timy res for just one result?



var time_diff = process.hrtime(start_time);
//popencl.vector_add(a, b, res);
//popencl.execute_kernel(['A', 'B'], ['Res']);
popencl.get_buffer('Res_0', stage_results[0]);
popencl.get_buffer('Res_0_input_counts', stage_input_count_buffers[0]);
popencl.get_buffer('Res_1', stage_results[1]);
popencl.get_buffer('Res_1_input_counts', stage_input_count_buffers[1]);


console.log('n_stage', n_stage);
//



//popencl.get_buffer('Res2', res2);
//popencl.get_buffer('Res3', res3);
//popencl.get_buffer('Res4', res4);
// Then let's execute the kernel on the buffer.
//console.log('res', res);
console.log('time_diff', time_diff);
console.log('stage_results[0]', stage_results[0]);
console.log('stage_input_count_buffers[0]', stage_input_count_buffers[0]);
console.log('stage_results[1]', stage_results[1]);
console.log('stage_input_count_buffers[1]', stage_input_count_buffers[1]);
//console.log('res2', res2);
//console.log('res3', res3);
//console.log('res4', res4);

popencl.get_buffer('Res_' + n_stage, stage_results[n_stage]);
popencl.get_buffer('Res_' + n_stage + '_input_counts', stage_input_count_buffers[n_stage]);

var last_res_buffer = stage_results[n_stage];
var last_input_count_buffers = stage_input_count_buffers[n_stage];

console.log('last_res_buffer[0]', last_res_buffer[0]);
console.log('last_input_count_buffers[0]', last_input_count_buffers[0]);




// And deallocate buffers and kernels in popencl.
popencl.release_all();
