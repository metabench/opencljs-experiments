var POpenCL = require('./cpp/build/release/ocl.node').MyObject;
var smalloc = require('smalloc');
var jsgui = require('../../ws/js/core/jsgui-lang-essentials');
var each = jsgui.eac;

var mod_write_kernel = require('./write-kernel');
var write_kernel_all_size_params = mod_write_kernel.write_kernel_all_size_params;
var write_kernel = mod_write_kernel.write_kernel;

// Perhaps running a kernel just once (or on one set of data) will not be so useful.
// Run kernel over set, get results, repeat...


// With averages, need somewhere to write the result.
// averages, need to do a for loop.

// Number of items in the range handled by each execution...

//var k2s = write_kernel('vecAdd', [['a', Float32Array], ['b', Float32Array]], ['res', Float32Array], `
//  res[id] = a[id] + b[id];
//`);

/*
var k2s = write_kernel('reduce_16_average', [['a', Float32Array]], ['res', Float32Array], `
  float total = 0;
  int p;
  for (int c = 0; c < 16; c++) {
    p = id * 16;
    total += a[p + c];
  }
  res[id] = total + 1;
`);
*/


// What about a general case?
var size = 129;
var reduction_factor = 128;


// 17, reduced by a factor of 128 would go to 1




var k3s;

// If we need to account for data that can not be divided evenly by the reduction factor,
//  we need a way of the kernel telling if a result index can not get complete data from the

// Don't think we should read the size because it's only for the first reduction.
//  Would definitely be easier if we can say what number it's reducing from and to.
//  Can't just rely on the reduction factor to calculate.

// Maybe the simpler system could average large chunks of numbers, but only work on multiples of 128 or such.

// However, for general purpose reduction kernels, it's probably making the kernel code aware of how many it's reducing from and to.
// Possibly similar with expansion kernels. Maybe they would be the same even. Different number of outputs to inputs, kernel handles it.

// Not so sure that the code should read the buffer size and make assumptions about the size of the calculation.


// A_B Reduce?
//  Only give it the size of one input vector...?

// Though is it possible to get more information into the function as standard or as an easy option?
//  not specify reduction necessarily?

// Kernels that include data on all the buffer sizes?
//  Or problem sizes?

// A kernel with the sizes of all the buffers.
// Does not need to differentiate between input and output buffers / memory
//  Should have the sizes of the various buffers that are part of the task.

// Then would need to include the weighting factor in the results.
//  Not really sure this will be as fast now.
//  And should it return two buffers?
//  Or include the weights with the buffers...

// Then next time around the algorithm would need to make use of the weights while doing the calculation.
// Does seem so much simpler to do a reduce which has got the right number of elements for the right size array.

// Although less efficient than using the right number to start with, a reduction kernel that provides the weights / the number of items each
// result is based on.


// Maybe a good algorithm would find the nearest multiple of 128^2?

// Also averages may be most useful on a seriously big input.

// Perhaps we call an averaging function that operates on the subset?


// Anyway, do the weighted system.


// non-weighted input to weighted output...
// then would be carring out the reduce again on weighted input.

// Then in the next pass we use those weights in calculating the next set of averages.

// Need to have an output set that's twice as big.

// For the moment, a reduction factor of 128 seems appropriate.

// However, when not so many items go into the calculation we'll need to use some weightings

// weighted_output_reduce_128_average
//  reduces by a factor of 128, but also includes the number of input items that went into any result value
//  So the next stage could take an average of weighted inputs.
//  And reduce from them, perhaps providing weighted outputs?


// If we are doing a reduce_128 and there are not 128 items, we can note that down and still provide an answer.

// Want to do another reduce on the data produced by the first reduce.

var k_weighted_reduce_128_average = write_kernel_all_size_params('weighted_reduce_128_average', [['a', Float32Array]], ['res', Float32Array], `


  //float total = 0;
  float total = 0;
  int processed_input_count = 0;
  int p;
  int p2;


  // Each logical item in the input has got two values.

  p = id * 128;

  //for (int c = 0; c < 128; c++) {
    //p2 = p + c;

    //if (p2 < size_a / 2) {

      // Then we act.
      //  I think we may have a structure for a reduce kernel.
      //  So we could do write_reduce_kernel.
      //  We have access to the sizes, and the inner loop.


      //total += a[p2 * 2];

      //processed_input_count += a[p2 * 2 + 1];
    //}

    //if (2 < n) {
    //  total += a[p2];
    //  c2++;
    //}

  //}
  res[id * 2] = 3;
  res[id * 2 + 1] = 3;
  //res[id] = total / 128;


  //res[id * 2] = total / processed_input_count;
  //res[id * 2 + 1] = processed_input_count;
`);

// So this would count how many values were included.


var k_weighted_output_reduce_128_average = write_kernel_all_size_params('weighted_output_reduce_128_average', [['a', Float32Array]], ['res', Float32Array], `


  //float total = 0;
  float total = 0;
  int processed_input_count = 0;
  int p;
  int p2;
  p = id * 128;


  for (int c = 0; c < 128; c++) {
    p2 = p + c;

    if (p2 < size_a) {

      // Then we act.
      //  I think we may have a structure for a reduce kernel.
      //  So we could do write_reduce_kernel.
      //  We have access to the sizes, and the inner loop.


      total += a[p2];
      processed_input_count++;
    }

    //if (2 < n) {
    //  total += a[p2];
    //  c2++;
    //}

  }
  //res[id * 2] = id;
  //res[id * 2 + 1] = id;
  //res[id] = total / 128;


  res[id * 2] = total / processed_input_count;
  res[id * 2 + 1] = processed_input_count;
`);



var k_reduce_16_average = write_kernel_all_size_params('reduce_16_average', [['a', Float32Array]], ['res', Float32Array], `
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










// just have a single
var reduced_1 = Math.ceil(size / reduction_factor);
console.log('reduced_1', reduced_1);



var reduced_2 = Math.ceil(reduced_1 / reduction_factor);
console.log('reduced_2', reduced_2);

var a = smalloc.alloc(size, smalloc.Types.Float);
//var b = smalloc.alloc(size, smalloc.Types.Float);

// * 2 so it holds weights / counts
var res = smalloc.alloc(reduced_1 * 2, smalloc.Types.Float);

var res2 = smalloc.alloc(reduced_2 * 2, smalloc.Types.Float);

var c;
for (c = 0; c < size; c++) {
    a[c] = c * 4 + 1;
    //b[c] = c * 2;
    //res[c] = 0;
}
// We can give it the kernel.
var popencl = new POpenCL();


//console.log('a', a);


popencl.add_buffer('A', size);
//popencl.add_buffer('B', size);


popencl.add_buffer('Res', reduced_1 * 2);
popencl.add_buffer('Res2', reduced_2 * 2);


popencl.add_kernel('weighted_output_reduce_128_average', kernelSource);

popencl.add_kernel('weighted_reduce_128_average', k_weighted_reduce_128_average);

// Let's set the first two buffers.
popencl.set_buffer('A', a);
//popencl.set_buffer('B', b);
// Queue input buffers, single output buffer.
//  Only will be one output buffer I think.
var start_time = process.hrtime();



popencl.execute_kernel_all_size_params('weighted_output_reduce_128_average', ['A'], 'Res');


popencl.execute_kernel_all_size_params('weighted_reduce_128_average', ['Res'], 'Res2');

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
popencl.get_buffer('Res', res);
popencl.get_buffer('Res2', res2);
// Then let's execute the kernel on the buffer.
//console.log('res', res);
console.log('time_diff', time_diff);
console.log('res', res);
console.log('res2', res2);
