#ifndef _libslic3r_h_
#define _libslic3r_h_

#include <ostream>
#include <iostream>
#include <math.h>
#include <vector>
#include <cstdint>

#ifdef _MSC_VER
#include <limits>
#define NOMINMAX
#endif

#ifdef _MSC_VER
    #define CONFESS(...) confess_at(__FILE__, __LINE__, __FUNCTION__, __VA_ARGS__)
#else
    #define CONFESS(...) confess_at(__FILE__, __LINE__, __func__, __VA_ARGS__)
#endif
void confess_at(const char *file, int line, const char *func, const char *pat, ...);

#if __cplusplus==201402L
    #define SLIC3R_CPPVER 14
    #define STDMOVE(WHAT) std::move(WHAT)
#elif __cplusplus==201103L
    #define SLIC3R_CPPVER 11
    #define STDMOVE(WHAT) std::move(WHAT)
#else
    #define SLIC3R_CPPVER 0
    #define STDMOVE(WHAT) (WHAT)
#endif

#define __TRANS(s) s
namespace Slic3r {

constexpr auto SLIC3R_VERSION = "1.3.1-dev";
#define SLIC3R_BUILD_COMMIT (Unknown revision)
#define VER1_(x) #x
#define VER_(x) VER1_(x)
#define BUILD_COMMIT VER_(SLIC3R_BUILD_COMMIT)
const auto SLIC3R_GIT_STR = std::string(BUILD_COMMIT);
const auto SLIC3R_GIT = SLIC3R_GIT_STR.c_str();

#ifdef _WIN32
typedef int64_t coord_t;
typedef double coordf_t;
#else
typedef long coord_t;
typedef double coordf_t;
#endif

constexpr auto SCALING_FACTOR = 0.000001;
inline constexpr coord_t  scale_(const coordf_t &val) { return val / SCALING_FACTOR; }
inline constexpr coordf_t unscale(const coord_t &val) { return val * SCALING_FACTOR; }
constexpr auto EPSILON = 1e-4;
constexpr auto SCALED_EPSILON = scale_(EPSILON);
constexpr auto RESOLUTION = 0.0125;
constexpr auto SCALED_RESOLUTION = scale_(RESOLUTION);
constexpr auto PI = 3.141592653589793238;
constexpr auto LOOP_CLIPPING_LENGTH_OVER_NOZZLE_DIAMETER = 0.15;
constexpr coord_t SMALL_PERIMETER_LENGTH = scale_(6.5) * 2 * PI;
constexpr coordf_t INSET_OVERLAP_TOLERANCE = 0.4;
constexpr coordf_t EXTERNAL_INFILL_MARGIN = 3;
constexpr coord_t SCALED_EXTERNAL_INFILL_MARGIN = scale_(EXTERNAL_INFILL_MARGIN);
constexpr float CLIPPER_OFFSET_SCALE = 100000.0;
enum Axis { X=0, Y, Z };

template <class T>
inline void append_to(std::vector<T> &dst, const std::vector<T> &src)
{
    dst.insert(dst.end(), src.begin(), src.end());
}

// Removed the parallelization templates that use boost::thread

} // namespace Slic3r

using namespace Slic3r;

#endif