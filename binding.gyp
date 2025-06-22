{
  "targets": [
    {
      "target_name": "portaudio",
      "sources": [ "native/portaudio.cc" ],
      "include_dirs": [
        "<!(node -p \"require('path').dirname(require.resolve('node-addon-api'))\")",
        "native/include"
      ],
      "dependencies": [ "<!(node -p \"require('node-addon-api').gyp\")" ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
      "conditions": [
        [ 'OS=="win"', {
          "libraries": [ "<(module_root_dir)/native/bin/windows/portaudio.lib" ],
          "copies": [
            {
              "files": [ "<(module_root_dir)/native/bin/windows/portaudio.dll" ],
              "destination": "<(PRODUCT_DIR)"
            }
          ]
        }],
        [ 'OS=="mac"', {
          "libraries": [ "<(module_root_dir)/native/bin/macos/libportaudio.dylib" ],
          "copies": [
            {
              "files": [ "<(module_root_dir)/native/bin/macos/libportaudio.dylib" ],
              "destination": "<(PRODUCT_DIR)"
            }
          ]
        }],
        [ 'OS=="linux"', {
          "libraries": [ "<(module_root_dir)/native/bin/linux/libportaudio.so.2" ],
          "copies": [
            {
              "files": [ "<(module_root_dir)/native/bin/linux/libportaudio.so.2" ],
              "destination": "<(PRODUCT_DIR)"
            }
          ]
        }]
      ]
    }
  ]
}
