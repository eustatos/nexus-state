window.BENCHMARK_DATA = {
  "lastUpdate": 1774513547150,
  "repoUrl": "https://github.com/eustatos/nexus-state",
  "entries": {
    "Benchmark": [
      {
        "commit": {
          "author": {
            "name": "eustatos",
            "username": "eustatos"
          },
          "committer": {
            "name": "eustatos",
            "username": "eustatos"
          },
          "id": "8ca9f8d66f8a61a998b2c763505538ba589935f0",
          "message": "Feature/benchmarks ci",
          "timestamp": "2026-03-24T19:39:17Z",
          "url": "https://github.com/eustatos/nexus-state/pull/62/commits/8ca9f8d66f8a61a998b2c763505538ba589935f0"
        },
        "date": 1774513546763,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry Overhead Analysis - current: set() with atomRegistry lookup",
            "value": 3018.327719673536,
            "range": "0.82",
            "unit": "ops/sec",
            "extra": "Samples: 1510\nMean: 0.331309ms\nP99: 0.507110ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry Overhead Analysis - proposed: state-in-atom direct access",
            "value": 356497.7525905771,
            "range": "0.22",
            "unit": "ops/sec",
            "extra": "Samples: 178249\nMean: 0.002805ms\nP99: 0.004809ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry.getStoresMap() overhead - direct Map access",
            "value": 172792.87788304902,
            "range": "0.15",
            "unit": "ops/sec",
            "extra": "Samples: 86397\nMean: 0.005787ms\nP99: 0.007714ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > Memory comparison - current: atomRegistry + store state",
            "value": 93.42626110901827,
            "range": "4.62",
            "unit": "ops/sec",
            "extra": "Samples: 47\nMean: 10.703629ms\nP99: 16.338702ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > Memory comparison - proposed: state-in-atom only",
            "value": 105820.43703213631,
            "range": "2.76",
            "unit": "ops/sec",
            "extra": "Samples: 52911\nMean: 0.009450ms\nP99: 0.031077ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - batch with computed atoms",
            "value": 57398.76548134844,
            "range": "14.14",
            "unit": "ops/sec",
            "extra": "Samples: 28739\nMean: 0.017422ms\nP99: 0.119892ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - batch: 100 sets, single notification",
            "value": 1351.063094488561,
            "range": "10.44",
            "unit": "ops/sec",
            "extra": "Samples: 676\nMean: 0.740158ms\nP99: 4.767328ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - nested batch calls",
            "value": 6321.571688231723,
            "range": "12.84",
            "unit": "ops/sec",
            "extra": "Samples: 3161\nMean: 0.158189ms\nP99: 4.948660ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - no batch: 100 sets, multiple notifications",
            "value": 1353.6089937988218,
            "range": "11.67",
            "unit": "ops/sec",
            "extra": "Samples: 677\nMean: 0.738766ms\nP99: 4.818977ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - atom with function update",
            "value": 2539.035410291421,
            "range": "2.68",
            "unit": "ops/sec",
            "extra": "Samples: 1270\nMean: 0.393850ms\nP99: 1.085202ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - concurrent subscriptions to same atom",
            "value": 36578.79468283675,
            "range": "3.90",
            "unit": "ops/sec",
            "extra": "Samples: 18349\nMean: 0.027338ms\nP99: 0.045816ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - rapid set/get cycles",
            "value": 2337.69500560801,
            "range": "2.89",
            "unit": "ops/sec",
            "extra": "Samples: 1169\nMean: 0.427772ms\nP99: 1.171132ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - create and cleanup 1000 atoms",
            "value": 459.63070511367476,
            "range": "19.38",
            "unit": "ops/sec",
            "extra": "Samples: 230\nMean: 2.175660ms\nP99: 8.847388ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - dynamic atoms with subscriptions",
            "value": 3544.793759410731,
            "range": "11.64",
            "unit": "ops/sec",
            "extra": "Samples: 1777\nMean: 0.282104ms\nP99: 5.293815ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - subscribe and unsubscribe 1000 times",
            "value": 6030.584633847735,
            "range": "2.77",
            "unit": "ops/sec",
            "extra": "Samples: 3016\nMean: 0.165821ms\nP99: 0.964719ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - 100 subscribers, 100 updates",
            "value": 5881.997976592738,
            "range": "2.61",
            "unit": "ops/sec",
            "extra": "Samples: 2941\nMean: 0.170010ms\nP99: 1.238447ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - 1000 subscribers, single update",
            "value": 4607.962712365991,
            "range": "11.78",
            "unit": "ops/sec",
            "extra": "Samples: 2304\nMean: 0.217016ms\nP99: 4.161087ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - complex dependency graph",
            "value": 355.56677672810014,
            "range": "1.54",
            "unit": "ops/sec",
            "extra": "Samples: 178\nMean: 2.812411ms\nP99: 4.619688ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 1 dependency",
            "value": 1361.705593803777,
            "range": "0.68",
            "unit": "ops/sec",
            "extra": "Samples: 681\nMean: 0.734373ms\nP99: 0.948530ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 10 dependencies",
            "value": 98.45546880609186,
            "range": "0.49",
            "unit": "ops/sec",
            "extra": "Samples: 50\nMean: 10.156876ms\nP99: 11.008606ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 5 dependencies",
            "value": 231.02535439334156,
            "range": "0.81",
            "unit": "ops/sec",
            "extra": "Samples: 116\nMean: 4.328529ms\nP99: 4.699185ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - create 1000 primitive atoms",
            "value": 11977.200569770775,
            "range": "1.71",
            "unit": "ops/sec",
            "extra": "Samples: 5989\nMean: 0.083492ms\nP99: 0.220669ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - diamond dependency pattern",
            "value": 746.674314102328,
            "range": "0.91",
            "unit": "ops/sec",
            "extra": "Samples: 374\nMean: 1.339272ms\nP99: 1.682690ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - get primitive atom - 10000 iterations",
            "value": 3395.778880462394,
            "range": "1.38",
            "unit": "ops/sec",
            "extra": "Samples: 1698\nMean: 0.294483ms\nP99: 0.511318ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - nested computed atoms (chain of 10)",
            "value": 284.67146956540034,
            "range": "0.96",
            "unit": "ops/sec",
            "extra": "Samples: 143\nMean: 3.512821ms\nP99: 3.933716ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - nested computed atoms (chain of 5)",
            "value": 582.9229170044099,
            "range": "1.14",
            "unit": "ops/sec",
            "extra": "Samples: 292\nMean: 1.715493ms\nP99: 2.094645ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - set primitive atom - 10000 iterations",
            "value": 307.4928446714562,
            "range": "0.74",
            "unit": "ops/sec",
            "extra": "Samples: 154\nMean: 3.252108ms\nP99: 3.724427ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - subscribe and update - 1000 iterations",
            "value": 2860.8797939078713,
            "range": "0.95",
            "unit": "ops/sec",
            "extra": "Samples: 1431\nMean: 0.349543ms\nP99: 0.605032ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Writable Atom Performance - writable atom with multiple operations",
            "value": 2525.5665016631356,
            "range": "2.87",
            "unit": "ops/sec",
            "extra": "Samples: 1263\nMean: 0.395951ms\nP99: 1.167826ms"
          }
        ]
      }
    ]
  }
}