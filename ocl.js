var POpenCL = require('./cpp/build/release/ocl.node').MyObject;
var smalloc = require('smalloc');


// This could wind up to be a good enough pattern for OpenCL propcessing.

// Initialize various things at object init - could compile various kernels.
// Then just have functions that process the data.

// Prov

// Procedural OpenCL addon.

// Can try making more complicated kernels.


// I think for the moment we will basically have 4 registers / virtual registers.
// Can assign data to buffers, shifting some of it.
// Can probably load quite a lot at once.
//  Eg load quite a lot of data to test.
//  Test it



// OK, it looks like OpenCL is very fast.

// We definitely need an easy way of writing this.

// It looks like it may take some transpiling to get multi-line strings working properly.

/*

var kernelSource = [

    "#pragma OPENCL EXTENSION cl_khr_fp64 : enable                    ",
    "__kernel void vecAdd(  __global float *a,                       ",
    "                       __global float *b,                       ",
    "                       __global float *c,                       ",
    "                       const unsigned int n)                    ",
    "{                                                               ",
    "    //Get our global thread ID                                  ",
    "    int id = get_global_id(0);                                  ",
    "                                                                ",
    "    //Make sure we do not go out of bounds                      ",
    "    if (id < n) {                                                ",
    "                                                                ",
    "        //for (int z = 0; z < 240; z++) {                        ",
    "             c[id] = a[id] + b[id];                                                       ",
    "                                                                ",
    "        //   c[id] = a[id] + b[id] + z;                                  ",
    "        //}                                                       ",
    "    }                                                            ",
    "                                                                ",
    "}                                                               "
].join('\n');
*/


var kernelSource =

`#pragma OPENCL EXTENSION cl_khr_fp64 : enable
__kernel void vecAdd(  __global float *a,
    __global float *b,
    __global float *res,
const unsigned int n)
{
    //Get our global thread ID
    int id = get_global_id(0);

    //Make sure we do not go out of bounds
    if (id < n) {

        //for (int z = 0; z < 240; z++) {
        res[id] = a[id] + b[id];
        //   c[id] = a[id] + b[id] + z;
        //}
    }

}`



/*
var kernelSource = `
    #pragma OPENCL EXTENSION cl_khr_fp64 : enable
    __kernel void vecAdd(  __global float *a,
                           __global float *b,
                           __global float *c,
                           const unsigned int n) {
        //Get our global thread ID
        int id = get_global_id(0);

        //Make sure we do not go out of bounds
        if (id < n) {

            //for (int z = 0; z < 240; z++) {
            [id] = a[id] + b[id];

            //   c[id] = a[id] + b[id] + z;
            //}
        }

    }
`
*/


var size = 16;
var a = smalloc.alloc(size, smalloc.Types.Float);
var b = smalloc.alloc(size, smalloc.Types.Float);
var res = smalloc.alloc(size, smalloc.Types.Float);

var c;

for (c = 0; c < size; c++) {
    a[c] = c;
    b[c] = c * 2;
    res[c] = 0;
}

// We can give it the kernel.

var popencl = new POpenCL();



//popencl.add_kernel()




//popencl.vector_add(a, b, res);#

// Looks like a decent setup with named buffers and kernels

// Could prepare a buffer, and declare a buffer schema.



popencl.add_buffer('A', 16);
popencl.add_buffer('B', 16);
popencl.add_buffer('Res', 16);

popencl.add_kernel('vecAdd', kernelSource);

// Let's set the first two buffers.

popencl.set_buffer('A', a);
popencl.set_buffer('B', b);


// Queue input buffers, single output buffer.
//  Only will be one output buffer I think.
var start_time = process.hrtime();
popencl.execute_kernel('vecAdd', ['A', 'B'], 'Res');
var time_diff = process.hrtime(start_time);
//popencl.vector_add(a, b, res);

//popencl.execute_kernel(['A', 'B'], ['Res']);

popencl.get_buffer('Res', res);
// Then let's execute the kernel on the buffer.


//console.log('res', res);
console.log('time_diff', time_diff);
console.log('res', res);
/*
popencl.save_buffer(a);
for (c = 0; c < size; c++) {
    ///a[c] = c;
    //b/[c] = c * 2;
    res[c] = 0;
}

console.log('res', res);

popencl.load_buffer(res);

console.log('res', res);

*/