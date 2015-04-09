var jsgui = require('../../ws/js/core/jsgui-lang-essentials');
var each = jsgui.eac;

var map_cl_param_types = {
  'Float32Array': 'float *',
  'Uint32Array': 'unsigned int *',
  'Uint64Array': 'unsigned long *',
  'Float32': 'float'

}

var Uint64Array = {};
var Float32 = {};

// I think we'll want to filter code as well.
//  Use split and join for replacements.

var replace = function(str, target, replacement) {
  return str.split(target).join(replacement);
}

var transpile = function(str) {
  str = replace(str, 'return ', 'res = ');

  str = replace(str, 'res', 'arr_output[id]');

  str = replace(str, 'value_input_count', 'input_counts[p2]');
  str = replace(str, 'val_input_count', 'input_counts[p2]');
  // input_counts[p2]

  str = replace(str, 'value', 'arr_input[p2]');
  str = replace(str, 'val', 'arr_input[p2]');

  //input[p2]

  return str;
}

var write_counted_reduction_kernels = function(name, type, reduction_factor, preparer, repeater, concluder) {
  var counted_output_only_name = replace(name, 'weighted_reduce', 'weighted_output_reduce');
  counted_output_only_name = replace(counted_output_only_name, 'counted_reduce', 'counted_output_reduce');

  var kernel_1 = write_counted_output_reduction_kernel(counted_output_only_name, type, reduction_factor, preparer, repeater, concluder);

  //console.log('counted_output_only_name', counted_output_only_name);

  //kernel_1._name = counted_output_only_name;

  //console.log('kernel_1._name', kernel_1._name);
  var kernel_2 = write_counted_reduction_kernel(name, type, reduction_factor, preparer, repeater, concluder);
  //kernel_2.name = name;


  return [[counted_output_only_name, kernel_1], [name, kernel_2]];

}



var write_counted_reduction_kernel = function(name, type, reduction_factor, preparer, repeater, concluder) {
  preparer = transpile(preparer);
  repeater = transpile(repeater);
  concluder = transpile(concluder);

  var res = write_kernel_all_size_params(name,
  [['arr_input', type], ['input_counts', Uint32Array],
  ['arr_output', type], ['output_input_counts', Uint32Array]],
  `int processed_input_count = 0;
  int p = id * ` + reduction_factor + `;
  int p2;
  ` + preparer + `
  int c;

  for (c = 0; c < ` + reduction_factor + `; c++) {
    p2 = p + c;
    if (p2 < size_arr_input) {
      processed_input_count += input_counts[p2];
    }
  }
  for (c = 0; c < ` + reduction_factor + `; c++) {
    p2 = p + c;
    if (p2 < size_arr_input) {
      ` + repeater + `
    }
  }
  ` + concluder + `
  output_input_counts[id] = processed_input_count;`);

  return res;
}

var write_counted_output_reduction_kernel = function(name, type, reduction_factor, preparer, repeater, concluder) {
  preparer = transpile(preparer);
  repeater = transpile(repeater);
  concluder = transpile(concluder);

  var res = write_kernel_all_size_params(name, [['arr_input', type], ['arr_output', type], ['output_input_counts', Uint32Array]],
  `int processed_input_count = 0;
  int p = id * ` + reduction_factor + `;
  int p2;
  ` + preparer + `
  for (int c = 0; c < ` + reduction_factor + `; c++) {
    p2 = p + c;
    if (p2 < size_arr_input) {
      ` + repeater + `
      processed_input_count++;
    }
  }
  ` + concluder + `
  output_input_counts[id] = processed_input_count;`);

  return res;

}


var get_cl_param_type = function(type) {
  var str_param_type;

  if (type === Float32Array) str_param_type = 'Float32Array';
  if (type === Uint32Array) str_param_type = 'Uint32Array';
  if (type === Uint64Array) str_param_type = 'Uint64Array';


  if (type === Float32) str_param_type = 'Float32';

  return map_cl_param_types[str_param_type];

}



var singular = function(type) {
  if (type == Float32Array) return Float32;
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

    if (param_type === 'float') str_param_type = 'Float32Array';
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

//var k2s = write_binary_operation_kernel('vecAdd', Float32Array, 'return a + b;')

//var k2s = write_kernel('vecAdd', [['a', Float32Array], ['b', Float32Array]], ['res', Float32Array], `
//  res[id] = a[id] + b[id];
//`);

var write_declare_line = function(name, type, value) {
  var cl_param_type = get_cl_param_type(type);



  var res = cl_param_type + ' ' + name;

  if (typeof value !== 'undefined') {
    res += ' = ' + value + ';'
  } else {
    res += ';';
  };

  res += '\n';
  return res;

}



// and string singular types



var write_binary_operation_kernel = function(name, type, source) {

  var sing_type = singular(type);

  var preparer = 'int id = get_global_id(0);\n' + write_declare_line('a', sing_type, 'arr_a[id]') + write_declare_line('b', sing_type, 'arr_b[id]');




  // Could have statements to set up the a and b local variables.

  // could write a couple of lines.
  //  float a = a[id]

  // Not sure that adding the Hungarian notation here will help that much...
  //  Except where we have both the array version and the local versions.

  // Could do a = , b =
  //  May be less efficient than compiling to the aray accesses.

  //source = write_declare_line('a', type) + write_declare_line('b', type) + 'a = arr_a[id];\nb=arr_b[id];' + source;




  return write_kernel_with_preparer(name, [['arr_a', type], ['arr_b', type]], ['arr_output', type], preparer, source)




}


// write kernel with pre-source

var write_kernel_with_preparer = function(name, input_parameters, output_parameter, preparer, source) {
  source = transpile(source);

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
  str_res += preparer;
  str_res += '\tif (id < n) {\n';
  str_res += '\t\t' + source.split('\n').join('\n\t\t') + '\n'
  //str_res += '\t\t' + source + '\n'
  str_res += '\t}\n';
  str_res += '}\n';
  return str_res;
}



var write_kernel = function(name, input_parameters, output_parameter, source) {
  var preparer = '\tint id = get_global_id(0);\n';

  return write_kernel_with_preparer(name, input_parameters, output_parameter, preparer, source);
}

module.exports = {
  'write_kernel': write_kernel,
  'write_binary_operation_kernel': write_binary_operation_kernel,
  'write_kernel_all_size_params': write_kernel_all_size_params,
  'write_counted_reduction_kernel': write_counted_reduction_kernel,
  'write_counted_output_reduction_kernel': write_counted_output_reduction_kernel,
  'write_counted_reduction_kernels': write_counted_reduction_kernels,
  'Uint64Array': Uint64Array
};
