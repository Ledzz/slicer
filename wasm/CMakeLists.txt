cmake_minimum_required(VERSION 3.10)
project(WasmProject)

add_executable(wasm_app main.cpp)
set(CMAKE_EXECUTABLE_SUFFIX ".js")
include_directories(./include)
include_directories(./Slic3r/xs/src/libslic3r)


target_link_options(wasm_app PRIVATE "-s" "MODULARIZE=1")
target_link_options(wasm_app PRIVATE "-s" "USE_PTHREADS=1")
target_link_options(wasm_app PRIVATE "-pthread")
target_link_options(wasm_app PRIVATE "-D" "BOOST_ROOT=/opt/homebrew/Cellar/boost/1.88.0/include/boost")