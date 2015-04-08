// Maybe a non-'harmony' version would be better?
//  Or use Babel with iojs?


'use strict';
var CPP_Obj = require('./cpp/build/release/ocl.node').MyObject;

class POpenCL {
  constructor() {
    this.cpp_obj = new CPP_Obj();
  }
  add_buffer(name, size) {
    console.log('add_buffer');
    return this.cpp_obj.add_buffer(name, size);
  }
  add_kernel(name, source) {
    return this.cpp_obj.add_kernel(name, source);
  }
  set_buffer(name, value) {
    return this.cpp_obj.set_buffer(name, value);
  }
  get_buffer(name, value) {
    return this.cpp_obj.get_buffer(name, value);
  }
  execute_kernel(name, input_param_names, output_param_name) {
    // execute_kernel('vecAdd', ['A', 'B'], 'Res');
    return this.cpp_obj.execute_kernel(name, input_param_names, output_param_name);
  }
  execute_kernel_all_size_params(name, param_names) {
    return this.cpp_obj.execute_kernel_all_size_params(name, param_names);
  }
  release_all() {
    return this.cpp_obj.release_all();
  }

  /*
  static NAN_METHOD(NAN_AddBuffer);
  static NAN_METHOD(NAN_AddKernel);
  static NAN_METHOD(NAN_SetBuffer);
  static NAN_METHOD(NAN_GetBuffer);
  static NAN_METHOD(NAN_ExecuteKernel);
  static NAN_METHOD(NAN_ExecuteKernelAllSizeParams);
  static NAN_METHOD(NAN_ReleaseAll);
  */

}

module.exports = POpenCL;
