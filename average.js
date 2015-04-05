var POpenCL = require('./cpp/build/release/ocl.node').MyObject;
var smalloc = require('smalloc');
var jsgui = require('../../ws/js/core/jsgui-lang-essentials');
var each = jsgui.eac;

var write_kernel = require('./write-kernel');

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

var reduction_factor = 32;

var k2s = write_kernel('reduce_16_average', [['a', Float32Array]], ['res', Float32Array], `
  //float total = 0;
  float total = 0;
  int p;
  for (int c = 0; c < 16; c++) {
    p = id * ` + reduction_factor + `;
    total += a[p + c];
  }
  //res[id] = 5;
  res[id] = total / 16;
`);

// Kernel that can execute with a different number of results being made to the input data.

// Can try doing a function that applies continually and reduces the amount of data.

// Reduction function.




// Will need to execute the reduction function until we just have 1 data left.

// Will try executing reduction kernel once.





// Averaging numbers...
// Can probably get the averages from groups quickly.
//  Looks like it would need a divide and conquor algorithm.



console.log('k2s', k2s);

var kernelSource = k2s;
var size = 1024;





// just have a single


var a = smalloc.alloc(size, smalloc.Types.Float);
//var b = smalloc.alloc(size, smalloc.Types.Float);
var res = smalloc.alloc(size / reduction_factor, smalloc.Types.Float);
var res2 = smalloc.alloc(size / reduction_factor / reduction_factor, smalloc.Types.Float);

var c;
for (c = 0; c < size; c++) {
    a[c] = c * 2 + 10;
    //b[c] = c * 2;
    //res[c] = 0;
}
// We can give it the kernel.
var popencl = new POpenCL();


console.log('a', a);


popencl.add_buffer('A', size);
//popencl.add_buffer('B', size);
popencl.add_buffer('Res', size / reduction_factor);
popencl.add_buffer('Res2', size / reduction_factor / reduction_factor);

popencl.add_kernel('reduce_16_average', kernelSource);
// Let's set the first two buffers.
popencl.set_buffer('A', a);
//popencl.set_buffer('B', b);
// Queue input buffers, single output buffer.
//  Only will be one output buffer I think.
var start_time = process.hrtime();

popencl.execute_kernel('reduce_16_average', ['A'], 'Res');
popencl.execute_kernel('reduce_16_average', ['Res'], 'Res2');

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
