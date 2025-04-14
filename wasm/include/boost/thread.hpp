
// thread_group_stub.hpp
#ifndef BOOST_THREAD_GROUP_STUB_HPP
#define BOOST_THREAD_GROUP_STUB_HPP

#include <vector>
#include <thread>

namespace boost {

class thread_group {
public:
    thread_group() = default;
    ~thread_group() = default;

    void add_thread(std::thread* t) {
        // In real Boost this takes ownership; here we just detach and delete
        if (t) {
            t->detach(); // or just skip entirely
            delete t;
        }
    }

    void join_all() {
        // no-op
    }

    void interrupt_all() {
        // no-op
    }

    std::size_t size() const {
        return 0;
    }
};

} // namespace boost

#endif // BOOST_THREAD_GROUP_STUB_HPP


// thread_stub.hpp
#ifndef BOOST_THREAD_STUB_HPP
#define BOOST_THREAD_STUB_HPP

#include <thread>

namespace boost {

using thread = std::thread;

} // namespace boost

#endif // BOOST_THREAD_STUB_HPP

// this_thread_stub.hpp
#ifndef BOOST_THIS_THREAD_STUB_HPP
#define BOOST_THIS_THREAD_STUB_HPP

#include <thread>
#include <chrono>

namespace boost {
namespace this_thread {

using std::this_thread::sleep_for;
using std::this_thread::sleep_until;
using std::this_thread::yield;

inline std::thread::id get_id() {
    return std::this_thread::get_id();
}

inline void interruption_point() {
    // No-op for WASM stub
}

} // namespace this_thread
} // namespace boost

#endif // BOOST_THIS_THREAD_STUB_HPP

// lock_guard_stub.hpp
#ifndef BOOST_LOCK_GUARD_STUB_HPP
#define BOOST_LOCK_GUARD_STUB_HPP

#include <mutex>

namespace boost {

template <typename Mutex>
using lock_guard = std::lock_guard<Mutex>;

} // namespace boost

#endif // BOOST_LOCK_GUARD_STUB_HPP

// function_stub.hpp
#ifndef BOOST_FUNCTION_STUB_HPP
#define BOOST_FUNCTION_STUB_HPP

#include <functional>

namespace boost {

template<typename T>
using function = std::function<T>;

} // namespace boost

#endif // BOOST_FUNCTION_STUB_HPP


#ifndef BOOST_MUTEX_STUB_HPP
#define BOOST_MUTEX_STUB_HPP

namespace boost {

class mutex {
public:
    mutex() = default;
    ~mutex() = default;

    void lock() {}
    void unlock() {}
    bool try_lock() { return true; }
};

class recursive_mutex {
public:
    recursive_mutex() = default;
    ~recursive_mutex() = default;

    void lock() {}
    void unlock() {}
    bool try_lock() { return true; }
};

template<typename Mutex>
class unique_lock {
public:
    explicit unique_lock(Mutex& m) : m_(m), owns_(true) {
        m_.lock();
    }

    ~unique_lock() {
        if (owns_) {
            m_.unlock();
        }
    }

    void lock() {
        m_.lock();
        owns_ = true;
    }

    void unlock() {
        m_.unlock();
        owns_ = false;
    }

    bool owns_lock() const { return owns_; }

private:
    Mutex& m_;
    bool owns_;
};

} // namespace boost

#endif // BOOST_MUTEX_STUB_HPP