
// ks file.

// kernelscript.

// basically will have language that transposes to simple C

/*

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

*/

// want really simple annotation, similar to JavaScript / TypeScript but with more detailed types

// from typescript: function formatName(first : string, last : string, middle = "") {


// hard to see the function running when not in opencl right now, but it may be possible to compile them to other sorts of language.



function^ vecAdd(a: Float32Array, b: Float32Array, res: Float32Array, x) {
    // the get id and bounds check are built in...

    // The inner part can be just the same once we have the arrays.

    res[x] = a[x] + b[3];


}
