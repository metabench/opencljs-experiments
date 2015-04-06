var jsgui = require('../../ws/js/core/jsgui-lang-essentials');
var each = jsgui.eac;

var map_cl_param_types = {
  'Float32Array': 'float *',
  'Uint32Array': 'unsigned int *',
  'Uint64Array': 'unsigned long *'

}

var Uint64Array = {};


var write_counted_reduction_kernel = function(name, type, reduction_factor, preparer, repeater, concluder) {
  var res = write_kernel_all_size_params(name,
  [['input', type], ['input_counts', Uint32Array],
  ['output', type], ['output_input_counts', Uint32Array]],
  `int processed_input_count = 0;
  int p = id * ` + reduction_factor + `;
  int p2;
  ` + preparer + `
  int c;

  for (c = 0; c < ` + reduction_factor + `; c++) {
    p2 = p + c;
    if (p2 < size_input) {
      processed_input_count += input_counts[p2];
    }
  }
  for (c = 0; c < ` + reduction_factor + `; c++) {
    p2 = p + c;
    if (p2 < size_input) {
      ` + repeater + `
    }
  }
  ` + concluder + `
  output_input_counts[id] = processed_input_count;`);

  return res;
}

var write_counted_output_reduction_kernel = function(name, type, reduction_factor, preparer, repeater, concluder) {

  var res = write_kernel_all_size_params(name, [['input', type], ['output', type], ['output_input_counts', Uint32Array]],
  `int processed_input_count = 0;
  int p = id * ` + reduction_factor + `;
  int p2;
  ` + preparer + `
  for (int c = 0; c < ` + reduction_factor + `; c++) {
    p2 = p + c;
    if (p2 < size_input) {
      ` + repeater + `
      processed_input_count++;
    }
  }
  ` + concluder + `
  output_input_counts[id] = processed_input_count;`);

  return res;

}




// And don't have specific output buffers / parameters.

var write_kernel_all_size_params = function(name, input_parameters, source) {
  var str_res = '#pragma OPENCL EXTENSION cl_khr_fp64 : enable \n';
  var param_name, param_type, str_param_type, cl_param_type;

  str_res += '__kernel void ' + name + '(';
  //var is_first_param = true;

  each(input_parameters, function(arr_param) {
    param_name = arr_param[0];
    param_type = arr_param[1];

    if (param_type === Float32Array) str_param_type = 'Float32Array';
    if (param_type === Uint32Array) str_param_type = 'Uint32Array';
    if (param_type === Uint64Array) str_param_type = 'Uint64Array';
    //Uint32Array

    cl_param_type = map_cl_param_types[str_param_type];

    str_res += '\t__global ';
    str_res += cl_param_type + param_name;
    str_res += ',\n';

    str_res += '\tconst unsigned int size_' + param_name + ',\n';

    // then a param for its size.



  });

  //str_res +=

  /*
  param_name = output_parameter[0];
  param_type = output_parameter[1];

  cl_param_type = map_cl_param_types[str_param_type];



  str_res += '\t__global ';
  str_res += cl_param_type + param_name + ',\n';
  */

  str_res += 'const unsigned int n)\n';
  str_res += '{\n';
  str_res += '\tint id = get_global_id(0);\n';
  str_res += '\tif (id < n) {\n';
  str_res += '\t\t' + source.split('\n').join('\n\t\t') + '\n'
  //str_res += '\t\t' + source + '\n'
  str_res += '\t}\n';
  str_res += '}\n';
  return str_res;
}

var write_kernel = function(name, input_parameters, output_parameter, source) {
  var str_res = '#pragma OPENCL EXTENSION cl_khr_fp64 : enable \n';
  var param_name, param_type, str_param_type, cl_param_type;

  str_res += '__kernel void ' + name + '(';
  //var is_first_param = true;

  each(input_parameters, function(arr_param) {
    param_name = arr_param[0];
    param_type = arr_param[1];

    if (param_type === Float32Array) str_param_type = 'Float32Array';

    cl_param_type = map_cl_param_types[str_param_type];

    str_res += '\t__global ';
    str_res += cl_param_type + param_name;
    str_res += ',\n'
  });

  //str_res +=
  param_name = output_parameter[0];
  param_type = output_parameter[1];

  cl_param_type = map_cl_param_types[str_param_type];
  str_res += '\t__global ';
  str_res += cl_param_type + param_name + ',\n';
  str_res += 'const unsigned int n)\n';
  str_res += '{\n';
  str_res += '\tint id = get_global_id(0);\n';
  str_res += '\tif (id < n) {\n';
  str_res += '\t\t' + source.split('\n').join('\n\t\t') + '\n'
  //str_res += '\t\t' + source + '\n'
  str_res += '\t}\n';
  str_res += '}\n';
  return str_res;
}

module.exports = {
  'write_kernel': write_kernel,
  'write_kernel_all_size_params': write_kernel_all_size_params,
  'write_counted_reduction_kernel': write_counted_reduction_kernel,
  'write_counted_output_reduction_kernel': write_counted_output_reduction_kernel,
  'Uint64Array': Uint64Array
};
