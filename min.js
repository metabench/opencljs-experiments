var POpenCL = require('./popencl');

//var POpenCL = require('./cpp/build/release/ocl.node').MyObject;
var smalloc = require('smalloc');
var smalloc_length = require('../smalloc-length/build/Release/smalloc-length.node');

var jsgui = require('../../ws/js/core/jsgui-lang-essentials');
var each = jsgui.eac;

var mod_write_kernel = require('./write-kernel');

var write_counted_reduction_kernels = mod_write_kernel.write_counted_reduction_kernels;

var write_counted_reduction_kernel = mod_write_kernel.write_counted_reduction_kernel;
var write_counted_output_reduction_kernel = mod_write_kernel.write_counted_output_reduction_kernel;
var write_kernel_all_size_params = mod_write_kernel.write_kernel_all_size_params;
var write_kernel = mod_write_kernel.write_kernel;

var size = 120000000;
var popencl = new POpenCL();
//var size = 1000;
// 21829262
// 51286125
//var size = 16;

// Probably should not need to set the reduction factor, we can have a reduction factor 8 as default.



var reduction_factor = 8;
console.log('initializing data');

var a = smalloc.alloc(size, smalloc.Types.Float);
var c;
var start_time = process.hrtime();
for (c = 0; c < size; c++) {
    //a[c] = c * 4 + 1;

    if (c % 16 === 0) {
      a[c] = 10;
    } else {
      a[c] = 2;
    }
}
var time_diff = process.hrtime(start_time);
// 17, reduced by a factor of 128 would go to 1
console.log('JavaScript init data time: ', time_diff);

var k3s;

// Add the kernels, then run them with data.
//  Should be able to give it the input buffer, and it processes it.
//  Or the input smalloc.


// Should be able to do this without setting up the intermediary buffers.
//  Maybe have the possibility of keeping them open.
//   Maybe would help with repeated calculations, could be worth trying, or allowing.

// May be nice to add and run a kernel.
//  could maybe allow for anonomous functions where it chooses the name of the function.

// Want a way to set up and run the reduction without needing much code in the application level.

// Easy to use API with sensible options.

// Should probably return a typed array...
//  Or even a normal array?
//  Or the count object in the same type, as in the OpenCL.

// Don't return the count for the moment.


// Using the smalloc float type.
//  But need to know the type.
//  Really giving it a smalloc type here.

// Nice if we could find out what type the smalloc is.

//

// Want to make it so it can automatically name result / reduction result buffers.
//  May want to keep them if functions with the same buffer requirements keep getting called.
//   For the moment will do automatic deallocation.


var min = popencl.execute_counted_reduction('min', {
  'prepare': `double min = INFINITY;`,
  'repeat': `if(val < min) min = val;`,
  'conclude': `return min;`
}, a, 'float');

console.log('min', min);


throw 'stop';



popencl.add_counted_reduction_kernels('counted_reduce_min', Float32Array, reduction_factor,
/* prepare    */ `double min = INFINITY;`,
/* repeat     */ `if(val < min) min = val;`,
/* conclude   */ `return min;`);

//var stage_size = size;
//var stage_reduced_size;

popencl.add_buffer('a', size);

var res_setup_buffers = popencl.setup_reduction_buffers('res', smalloc.Types.Float, size, reduction_factor);
// Not so sure this needs to return the actual buffers?




//var stage_sizes = res_setup_buffers[0];

// Really need the last buffer(s) to be returned.



//var stage_results = res_setup_buffers[1];
//var stage_input_count_buffers = res_setup_buffers[2];

var n_stage = stage_sizes.length - 1;

// Let's set the first two buffers.
popencl.set_buffer('a', a);

start_time = process.hrtime();
// First reduction, factor of n, but it's not necessary to have the full n items, or have a number of items that's divisible by n.



// popencl.execute_counted_reduction_kernel('counted_reduce_min', 'a', 'res')
// will return the final buffer.

// Possibly should return a GCd object
//  or have the possibility of doing so

// Could differentiate between a smalloc type and a typed array.




// will automatically create the buffers.
//  needs to read a smalloc item's length (using C++)

// res = popencl.execute_counted_reduction_kernel('counted_reduce_min', a);


// Perhaps it does not even need to be given the result buffer names.
//  Could have options to keep the result reduce buffers open.


// And could have a default reduction factor too.


// Having them within an object rather than array would make bigger code, but does not rely on comments for meaning.
//  But I think the comments system works better, apart from not allowing nested comments.
//  Stick with just the arrays for the moment.


// var res = popencl.reduce_counted(Float32Array, {
//  'prepare': ...
//  ...
//}
///* prepare    */ `double min = INFINITY;`,
///* repeat     */ `if(val < min) min = val;`,
///* conclude   */ `return min;`)

// var res = popencl.execute_reduction_kernel(a);


//  and just get the answer from it.
//  could have an error thrown if the total count does not equal the input size


// just execute counted reduction kernel...
//  and have other versions that run kernels more efficiently using this.
// could use some polymorphism.

// execute_counted_reduction_kernel
//  and it may as well return the result buffer?
//  later on...
//  For the moment it will be given the result buffer ref.


// Definitely easier if it can take the smallocs as inputs and outputs.


// the system that gets the smalloc lengths may be helpful with the buffers.


popencl.execute_reduction_kernel('counted_reduce_min', 'a', 'res', n_stage);


popencl.execute_kernel_all_size_params('counted_output_reduce_min', ['a', 'res_0', 'res_0_input_counts']);

var level = 1;

while (level <= n_stage) {
  var prev_level = level - 1;
  popencl.execute_kernel_all_size_params('counted_reduce_min', ['res_' + prev_level, 'res_' + prev_level + '_input_counts', 'res_' + level, 'res_' + level + '_input_counts']);
  level++;
}

time_diff = process.hrtime(start_time);


console.log('n_stage', n_stage);
console.log('time_diff', time_diff);

// Get it into the last buffer.

var b_res = smalloc.alloc(1, smalloc.Types.Float);
console.log('b_res', b_res);

popencl.get_buffer('res_' + n_stage, stage_results[n_stage]);
popencl.get_buffer('res_' + n_stage + '_input_counts', stage_input_count_buffers[n_stage]);

var last_res_buffer = stage_results[n_stage];
var last_input_count_buffers = stage_input_count_buffers[n_stage];

console.log('last_res_buffer[0]', last_res_buffer[0]);
console.log('last_input_count_buffers[0]', last_input_count_buffers[0]);

// And deallocate buffers and kernels in popencl.
popencl.release_all();
