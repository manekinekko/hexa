load("@npm_bazel_typescript//:index.bzl", "ts_library")

package(default_visibility = ["//visibility:public"])

ts_library(
    name = "{{functionHttpName}}",
    srcs = ["index.ts"],
    deps = ["@npm//@azure/functions"]
)