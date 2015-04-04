#include <nan.h>
#include "popencl.h"

using namespace v8;

void InitAll(Handle<Object> exports) {
  MyObject::Init(exports);
}

NODE_MODULE(addon, InitAll)