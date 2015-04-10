var POpenCL = require('./popencl');
//var POpenCL = require('./cpp/build/release/ocl.node').MyObject;
var smalloc = require('smalloc');
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

var reduction_factor = 8;
console.log('initializing data');

var a = smalloc.alloc(size, smalloc.Types.Float);
var b = smalloc.alloc(size, smalloc.Types.Float);
var start_time = process.hrtime();
for (var c = 0; c < size; c++) {
    if (c % 16 === 0) {
      a[c] = 10;
      b[c] = 11;
    } else {
      a[c] = 2;
      b[c] = 3;
    }
}

var time_diff = process.hrtime(start_time);
console.log('JavaScript init data time: ', time_diff);



// Gets a function that can be called to do a counted reduction.

//popencl.fn_counted_reduction();

// Execute a counted reduction, but have it refer to an existing buffer that's already loaded.
//  This will be quicker.

// It's still compiling the kernel.
//  See if we can get the kernel compilation times.

var kernel_def = {
  'prepare':   `double min = INFINITY;`,
  'repeat':    `  if(val < min) min = val;`,
  'conclude':  `return min;`
};


// Would be interested in doing multiple executions, using a cached kernel.
//  For the moment, it should save the kernel when it's named.
//  Then we should be able to call the kernel by name.




// This works

// Should not really need to use a counted reduction, like the average.
//  The maximum found does not depend on input counts.

var with_loading_buffers = function() {
  start_time = process.hrtime();
  var min = popencl.execute_counted_reduction('min', kernel_def, a, 'float');
  time_diff = process.hrtime(start_time);
  console.log('with_loading_buffers time: ', time_diff);
  popencl.release_all();
}
//with_loading_buffers();

var preloaded_buffers = function() {
  popencl.add_buffer('a', size);
  popencl.set_buffer('a', a);

  start_time = process.hrtime();
  var min = popencl.execute_counted_reduction('min', kernel_def, 'a', 'float');
  time_diff = process.hrtime(start_time);
  console.log('with compilation time: ', time_diff);

  console.log('min', min);


  // execute_counted_reduction without a kernel_def.
  //  It will execute the reduction by name.
  //  Perhaps a kernel should have an attached data type, so it knows already it's a float.
  //   Also need to make kernels work with other data types, such as doubles.




  start_time = process.hrtime();
  min = popencl.execute_counted_reduction('min', 'b', 'float');
  time_diff = process.hrtime(start_time);
  console.log('without kernel compilation time: ', time_diff);

}
preloaded_buffers();




// Then we could execute another counted reduction.



// 17, reduced by a factor of 128 would go to 1
//console.log('execute_counted_reduction time: ', time_diff);


//console.log('min', min);




/*

popencl.add_buffer('a', size);
popencl.set_buffer('a', a);

*/
