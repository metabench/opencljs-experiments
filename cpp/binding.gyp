{
  "targets": [
    {
      "target_name": "ocl",
      "sources": [ "addon.cc", "popencl.cc" ],

      'include_dirs' : [
        "<!(node -e \"require('nan')\")",
        'C:\\AMD'

      ],
      'library_dirs' : [
        'C:\\AMD'
      ],


      'libraries': ['opengl32.lib', 'OpenCL.lib']
    }
  ]
}