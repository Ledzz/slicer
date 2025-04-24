cmake_minimum_required(VERSION 3.10)
project(WasmProject)

add_executable(wasm_app main.cpp)
set(CMAKE_EXECUTABLE_SUFFIX ".js")
include_directories(./include)
#include_directories(/opt/homebrew/Cellar/boost/1.88.0/include)
include_directories(./Slic3r/xs/src/libslic3r)
set(BOOST_ROOT "/opt/homebrew/Cellar/boost/1.88.0/")
set(Boost_INCLUDE_DIR "/opt/homebrew/Cellar/boost/1.88.0/include")

# target_compile_definitions(wasm_app PRIVATE BOOST_DISABLE_THREADS)
find_package(Boost REQUIRED COMPONENTS thread)
find_package(Threads REQUIRED)

target_link_libraries(wasm_app PRIVATE Boost::thread Threads::Threads)

target_link_options(wasm_app PRIVATE "-s" "MODULARIZE=1")
#target_link_options(wasm_app PRIVATE "-s" "USE_PTHREADS=1")
#target_link_options(wasm_app PRIVATE "-pthreads")
#target_link_options(wasm_app PRIVATE "-D" "BOOST_HAS_THREADS=0")

# target_link_options(wasm_app PRIVATE "-D" "BOOST_ROOT=/opt/homebrew/Cellar/boost/1.88.0/include")