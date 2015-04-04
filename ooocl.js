//var cpp_mod = require('./cpp/build/Release/ocl.node');

//var res = cpp_mod.log_opencl_info();

var jsgui = require('../../ws/js/core/jsgui-lang-essentials');
var ArrayType = require("ref-array");

var each = jsgui.eac;

var nooocl = require('nooocl');
var CLHost = nooocl.CLHost;
var CLPlatform = nooocl.CLPlatform;
var CLDevice = nooocl.CLDevice;
var CLContext = nooocl.CLContext;
var CLBuffer = nooocl.CLBuffer;
var CLCommandQueue = nooocl.CLCommandQueue;
var CLUserEvent = nooocl.CLUserEvent;
var NDRange = nooocl.NDRange;
var CLProgram = nooocl.CLProgram;
var CLKernel = nooocl.CLKernel;
var CLImage2D = nooocl.CLImage2D;
var CLImage3D = nooocl.CLImage3D;
var CLSampler = nooocl.CLSampler;

var host = new CLHost(1.1); // for OpenCL 1.2

var platforms = host.getPlatforms();

//console.log('platforms', platforms);

console.log('platforms.length', platforms.length);

var found_gpu;

each(platforms, function(platform, i) {
    //console.log('');
    //console.log('platform', i);
    //console.log('platform', platform);
    console.log('platform.cl.types.PlatformInfo', platform.cl.types.PlatformInfo);
    console.log('platform.cl.types.DeviceInfo', platform.cl.types.DeviceInfo);
    console.log('platform.cl.types.DeviceType', platform.cl.types.DeviceType);

    var keys = Object.keys(platform.cl.types);
    //console.log('keys', keys);


    var cpus = platform.cpuDevices();

    each(cpus, function(cpuDevice, i) {
        console.log('cpu', i);
        //console.log('cpu', cpuDevice);
        var maxComputeUnits = cpuDevice.maxComputeUnits;
        var maxWorkItemSizes = cpuDevice.maxWorkItemSizes;

        console.log('maxComputeUnits', maxComputeUnits);
        console.log('maxWorkItemSizes', maxWorkItemSizes);

    });

    var gpus = platform.gpuDevices();

    each(gpus, function(gpuDevice, i) {
        found_gpu = gpuDevice;

        console.log('gpu', i);
        //console.log('gpu', gpuDevice);
        var maxComputeUnits = gpuDevice.maxComputeUnits;
        var maxWorkItemSizes = gpuDevice.maxWorkItemSizes;

        console.log('maxComputeUnits', maxComputeUnits);
        console.log('maxWorkItemSizes', maxWorkItemSizes);

    });

    var accels = platform.accelDevices();

    console.log('cpus.length', cpus.length);
    console.log('gpus.length', gpus.length);
    console.log('accels.length', accels.length);

    // Basically, want to select the GPU.


});


var context = new CLContext(found_gpu);
var device = found_gpu;

var queue = new CLCommandQueue(context, found_gpu);

var FloatArray = new ArrayType("float");
var srcArray = new FloatArray(5);
var dstArray = new FloatArray(5);

//console.log('dstArray', dstArray);


var copyMemKernel =
    "kernel void copy(global float* src, global float* dst, uint begin)" +
    "{" +
    "uint idx = get_global_id(0);" +
    "dst[idx - 1] = src[idx + begin];" +
    "}";



for (i = 0; i < srcArray.length; i++) {
    srcArray[i] = (i + 1) * 1.1;
}
for (i = 0; i < dstArray.length; i++) {
    dstArray[i] = 0.0;
}
var src = CLBuffer.wrap(context, srcArray);
var dst = CLBuffer.wrap(context, dstArray);

var queue = new CLCommandQueue(context, device);
var program = context.createProgram(copyMemKernel);

var v1, v2;

program.build().then(function () {


    var buildStatus = program.getBuildStatus(device);
    if (buildStatus < 0) {
        //assert.fail("Build failed.\n" + program.getBuildLog(device));
    }

    console.log('buildStatus', buildStatus);
    var kernel = program.createKernel("copy");
    //assert(kernel ? true : false);
    //assert(kernel.handle ? true : false);
    //assert.equal("copy", kernel.name);
    //var kernels = program.createAllKernels();
    //assert(_.isArray(kernels));
    //assert.equal(1, kernels.length);
    //assert.equal(kernel.name, kernels[0].name);

    kernel.setArg(0, src);
    kernel.setArg(1, dst);
    kernel.setArg(2, 1, "uint");
    queue.enqueueNDRangeKernel(kernel, new NDRange(2));

    //var out = {};

    console.log('pre queue.enqueueReadBuffer');

    //queue.enqueueMapBuffer(dst, host.cl.defs.CL_MAP_READ | host.cl.defs.CL_MAP_WRITE, 0, dst.size, out);

    queue.enqueueReadBuffer(
        src,
        0,
        dst.size,
        dstArray.buffer, function() {
            // Data is copied into host's destNodeJSBuffer from the device
            console.log('2) dstArray', dstArray);
        })


    //setTimeout(function() {
    //    console.log('2 done');
    //}, 1000)
    /*



    .then(function () {
        var buffer = ref.reinterpret(out.ptr, dst.size, 0);
        var v1 = ref.types.float.get(buffer, 0).toFixed(2);
        var v2 = dstArray[0].toFixed(2);

        console.log('dstArray', dstArray);

        //assert.equal(v1, v2);
        //assert.equal(v1, 3.3);
        dstArray[0] = 0.0;

        v1 = ref.types.float.get(buffer, 1 * ref.types.float.size).toFixed(2);
        v2 = dstArray[1].toFixed(2);
        //assert.equal(v1, v2);
        //assert.equal(v1, 4.4);
        dstArray[1] = 0.0;

        v1 = ref.types.float.get(buffer, 2 * ref.types.float.size).toFixed(2);
        v2 = dstArray[2].toFixed(2);
        //assert.equal(v1, v2);
        //assert.equal(v1, 5.5);
        dstArray[2] = 0.0;

        queue.enqueueUnmapMemory(dst, out.ptr);
    });
    */

    //console.log('res', res);
    //console.log('out', out);

    //var func = kernel.bind(queue, new NDRange(3), null, new NDRange(1));
    //func(src, dst, { "uint": 1 });

    //console.log('dst', dst);
    //console.log('dstArray', dstArray);

    //var out = {};

    //var prom = queue.waitable().enqueueMapBuffer(dst, host.cl.defs.CL_MAP_READ | host.cl.defs.CL_MAP_WRITE, 0, dst.size, out).promise;

    //console.log('prom', prom);

    //console.log('prom.then', prom.then);

    //prom.then(function() {
    //    console.log('prom cb');
    //}, function(err) {
    //    console.log('prom err', err);
    //})

    //console.log('dstArray', dstArray);






    /*
    var assertValues = function () {
        var out = {};
        return queue.waitable().enqueueMapBuffer(dst, host.cl.defs.CL_MAP_READ | host.cl.defs.CL_MAP_WRITE, 0, dst.size, out).promise
            .then(function () {
                var buffer = ref.reinterpret(out.ptr, dst.size, 0);
                var v1 = ref.types.float.get(buffer, 0).toFixed(2);
                var v2 = dstArray[0].toFixed(2);
                assert.equal(v1, v2);
                assert.equal(v1, 3.3);
                dstArray[0] = 0.0;

                v1 = ref.types.float.get(buffer, 1 * ref.types.float.size).toFixed(2);
                v2 = dstArray[1].toFixed(2);
                assert.equal(v1, v2);
                assert.equal(v1, 4.4);
                dstArray[1] = 0.0;

                v1 = ref.types.float.get(buffer, 2 * ref.types.float.size).toFixed(2);
                v2 = dstArray[2].toFixed(2);
                assert.equal(v1, v2);
                assert.equal(v1, 5.5);
                dstArray[2] = 0.0;

                queue.enqueueUnmapMemory(dst, out.ptr);
            });
    };

    // Test bind:
    var func = kernel.bind(queue, new NDRange(3), null, new NDRange(1));
    func(src, dst, { "uint": 1 });

    return assertValues()
        .then(function () {
            // Test direct call:
            kernels[0].setArg(0, src);
            kernels[0].setArg(1, dst);
            kernels[0].setArg(2, 1, "uint");
            queue.enqueueNDRangeKernel(kernels[0], new NDRange(3), null, new NDRange(1));

            return assertValues();
        });
    */
}).nodeify(function(err, res) {
    console.log('err', err);
    console.log('res', res);


    //setTimeout(function() {
    //    console.log('done');
    //}, 1000)



});