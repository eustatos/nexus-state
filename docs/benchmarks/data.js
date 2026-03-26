window.BENCHMARK_DATA = {
  "lastUpdate": 1774521281460,
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
      },
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
          "id": "75c1962b0c15ba77648426c4f9ba67e483d022af",
          "message": "Epic/phase 0 performance",
          "timestamp": "2026-03-24T19:39:17Z",
          "url": "https://github.com/eustatos/nexus-state/pull/65/commits/75c1962b0c15ba77648426c4f9ba67e483d022af"
        },
        "date": 1774519435074,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry Overhead Analysis - current: set() with atomRegistry lookup",
            "value": 2941.6433669247817,
            "range": "1.68",
            "unit": "ops/sec",
            "extra": "Samples: 1471\nMean: 0.339946ms\nP99: 0.739063ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry Overhead Analysis - proposed: state-in-atom direct access",
            "value": 500985.70642241056,
            "range": "0.34",
            "unit": "ops/sec",
            "extra": "Samples: 250493\nMean: 0.001996ms\nP99: 0.003275ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry.getStoresMap() overhead - direct Map access",
            "value": 180261.64596610903,
            "range": "0.22",
            "unit": "ops/sec",
            "extra": "Samples: 90131\nMean: 0.005547ms\nP99: 0.008940ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > Memory comparison - current: atomRegistry + store state",
            "value": 93.02526950494291,
            "range": "4.88",
            "unit": "ops/sec",
            "extra": "Samples: 47\nMean: 10.749767ms\nP99: 16.544673ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > Memory comparison - proposed: state-in-atom only",
            "value": 84341.17750484044,
            "range": "1.34",
            "unit": "ops/sec",
            "extra": "Samples: 42171\nMean: 0.011857ms\nP99: 0.032425ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - batch with computed atoms",
            "value": 50170.40618653039,
            "range": "28.36",
            "unit": "ops/sec",
            "extra": "Samples: 25086\nMean: 0.019932ms\nP99: 0.133309ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - batch: 100 sets, single notification",
            "value": 1359.132079999667,
            "range": "11.00",
            "unit": "ops/sec",
            "extra": "Samples: 680\nMean: 0.735764ms\nP99: 4.763472ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - nested batch calls",
            "value": 6024.577382652896,
            "range": "13.27",
            "unit": "ops/sec",
            "extra": "Samples: 3032\nMean: 0.165987ms\nP99: 0.211381ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - no batch: 100 sets, multiple notifications",
            "value": 1382.847170096711,
            "range": "10.90",
            "unit": "ops/sec",
            "extra": "Samples: 692\nMean: 0.723146ms\nP99: 4.760888ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - atom with function update",
            "value": 2336.6330836659713,
            "range": "3.92",
            "unit": "ops/sec",
            "extra": "Samples: 1169\nMean: 0.427966ms\nP99: 1.679317ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - concurrent subscriptions to same atom",
            "value": 31393.359763832537,
            "range": "7.01",
            "unit": "ops/sec",
            "extra": "Samples: 15697\nMean: 0.031854ms\nP99: 0.045138ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - rapid set/get cycles",
            "value": 2027.841913500185,
            "range": "4.57",
            "unit": "ops/sec",
            "extra": "Samples: 1014\nMean: 0.493135ms\nP99: 2.000363ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - create and cleanup 1000 atoms",
            "value": 451.43407051192463,
            "range": "19.23",
            "unit": "ops/sec",
            "extra": "Samples: 226\nMean: 2.215163ms\nP99: 8.794606ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - dynamic atoms with subscriptions",
            "value": 3258.224425264788,
            "range": "12.02",
            "unit": "ops/sec",
            "extra": "Samples: 1643\nMean: 0.306916ms\nP99: 5.581983ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - subscribe and unsubscribe 1000 times",
            "value": 5268.804855919384,
            "range": "5.13",
            "unit": "ops/sec",
            "extra": "Samples: 2635\nMean: 0.189796ms\nP99: 1.805809ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - 100 subscribers, 100 updates",
            "value": 5751.32979753878,
            "range": "3.73",
            "unit": "ops/sec",
            "extra": "Samples: 2876\nMean: 0.173873ms\nP99: 1.505218ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - 1000 subscribers, single update",
            "value": 4203.774778562417,
            "range": "12.29",
            "unit": "ops/sec",
            "extra": "Samples: 2102\nMean: 0.237881ms\nP99: 4.342901ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - complex dependency graph",
            "value": 347.9607059944468,
            "range": "1.50",
            "unit": "ops/sec",
            "extra": "Samples: 175\nMean: 2.873888ms\nP99: 4.048813ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 1 dependency",
            "value": 1321.2927674758942,
            "range": "0.93",
            "unit": "ops/sec",
            "extra": "Samples: 661\nMean: 0.756835ms\nP99: 1.055910ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 10 dependencies",
            "value": 92.77827910619602,
            "range": "0.54",
            "unit": "ops/sec",
            "extra": "Samples: 47\nMean: 10.778385ms\nP99: 11.488635ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 5 dependencies",
            "value": 212.2256526262108,
            "range": "0.64",
            "unit": "ops/sec",
            "extra": "Samples: 107\nMean: 4.711966ms\nP99: 5.332884ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - create 1000 primitive atoms",
            "value": 12774.85450434609,
            "range": "2.06",
            "unit": "ops/sec",
            "extra": "Samples: 6388\nMean: 0.078279ms\nP99: 0.218324ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - diamond dependency pattern",
            "value": 686.4784123612746,
            "range": "1.36",
            "unit": "ops/sec",
            "extra": "Samples: 344\nMean: 1.456710ms\nP99: 1.931173ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - get primitive atom - 10000 iterations",
            "value": 2820.4866453265536,
            "range": "3.09",
            "unit": "ops/sec",
            "extra": "Samples: 1411\nMean: 0.354549ms\nP99: 0.636315ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - nested computed atoms (chain of 10)",
            "value": 275.18572653592577,
            "range": "1.20",
            "unit": "ops/sec",
            "extra": "Samples: 138\nMean: 3.633909ms\nP99: 4.154145ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - nested computed atoms (chain of 5)",
            "value": 560.5083549874038,
            "range": "1.39",
            "unit": "ops/sec",
            "extra": "Samples: 281\nMean: 1.784095ms\nP99: 2.342491ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - set primitive atom - 10000 iterations",
            "value": 309.7931517321748,
            "range": "0.57",
            "unit": "ops/sec",
            "extra": "Samples: 155\nMean: 3.227960ms\nP99: 3.464269ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - subscribe and update - 1000 iterations",
            "value": 2773.6647471420365,
            "range": "0.98",
            "unit": "ops/sec",
            "extra": "Samples: 1387\nMean: 0.360534ms\nP99: 0.624028ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Writable Atom Performance - writable atom with multiple operations",
            "value": 2312.5698328130293,
            "range": "3.79",
            "unit": "ops/sec",
            "extra": "Samples: 1157\nMean: 0.432419ms\nP99: 1.505671ms"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astashkinav@gmail.com",
            "name": "eustatos",
            "username": "eustatos"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "f1aa2220ebb50b45b1e4cf2461420e586a03c5ab",
          "message": "Epic/phase 0 performance (#65)\n\n* perf: eliminate O(n) overhead in set() (#59)\n\n- Register atoms only in current store instead of iterating all stores\n- Add private registry property to StoreImpl for O(1) registration\n- Remove duplicate registration from AtomStateManager\n\nFixes #55\n\n* feat: implement lazy atom registration (#56)\n\n* feat: implement lazy atom registration (#56)\n\n- Add _lazyRegistration metadata to atoms\n- Register atoms on first get()/set() instead of creation\n- Add ensureAtomRegistered() in StoreImpl and AtomStateManager\n- Update TimeTravelController to force-register atoms in capture()\n- Add atomRegistry.isRegistered() helper method\n- Add 17 tests for lazy registration\n- Configure vitest to use src/ for faster development\n\nMemory savings: ~30% for unused atoms\n\n* test: update tolerance and lazy registration tests\n\n- Update atom-creation.test.ts for lazy registration\n- Update atom-registry.test.ts to trigger lazy registration\n- Update duplicate-names.test.ts for lazy registration\n- Increase benchmark tolerance for CI stability (8-10%)\n\nAll 1241 tests now pass\n\n* test(time-travel): update tests for lazy registration\n\n- Add store.get() calls to trigger lazy registration before capture()\n- Update computed atom tests to access dependencies explicitly\n- Update edge-cases tests for lazy registration\n\nPartial fix - 15 tests still failing due to snapshot expectations\n\n* test: fix test configurations and memory issues\n\n- demo-devtools: add time-travel dependency and fix vitest config\n- demo-editor: fix SnapshotDiff tests, add test timeout config\n- form-schema-dsl: fix async-validator timeout, exclude parser tests\n- form-schema-ajv: update validation tests for format errors\n- core: adjust benchmark tolerances for registry overhead\n- web-worker: skip failing test, fix vitest config\n- demo-family: point to source files for tests\n\nAlso:\n- Add project metadata files (.github/)\n- Add time-travel demo example\n- Add registry overhead benchmark\n- Update .gitignore to exclude .qwen/ settings\n\n* Feature/benchmarks ci\n\n* infra: setup benchmarks CI pipeline (#57)\n\n- Add .github/workflows/benchmarks.yml for automated benchmark runs\n- Add scripts/convert-bench-results.js for JSON format conversion\n- Update vitest.config.js with benchmark output configuration\n- Update package.json with bench:convert script\n- Fix bench script path (packages/core/src/__benchmarks__ -> packages/core/__benchmarks__)\n- Add benchmark result files to .gitignore\n\nFeatures:\n- Runs benchmarks on every PR (non-blocking)\n- Publishes results as GitHub comment\n- Detects performance regressions (>10% threshold)\n- Stores historical data in docs/benchmarks\n\nFixes #57\n\n* Docs/performance documentation\n\n* docs: add performance documentation (#58)\n\n- Add comprehensive best-practices.md with patterns and anti-patterns\n- Update performance/index.md with quick start benchmarks and examples\n- Fix dead links in query/mutations-typing.md\n- Move CONTRIBUTING.md from docs/ to project root\n- Remove internal working documents (ANALYSIS_COMPETITIVE-REVIEW, DEVELOPMENT_PLAN, TECHNICAL_SPEC, etc.)\n- Update VitePress config with performance sidebar navigation\n\n* docs: remove internal working documents\n\n- Delete ANALYSIS_COMPETITIVE-REVIEW.md (internal planning)\n- Delete DEVELOPMENT_PLAN.md (internal roadmap)\n- Delete TECHNICAL_SPEC.md (internal specification)\n- Delete COVERAGE-SYSTEM.md (internal testing docs)\n- Delete COVERALLS_SETUP.md (internal setup guide)\n- Delete DEVELOPMENT_GUIDE.md (developer setup)\n- Delete linting-setup.md (internal configuration)\n\nFixes #58",
          "timestamp": "2026-03-26T14:33:03+04:00",
          "tree_id": "ce81aac6b3f4e3ca752dd2c0cafa1c4d8934da61",
          "url": "https://github.com/eustatos/nexus-state/commit/f1aa2220ebb50b45b1e4cf2461420e586a03c5ab"
        },
        "date": 1774521280841,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry Overhead Analysis - current: set() with atomRegistry lookup",
            "value": 2816.993674081836,
            "range": "1.26",
            "unit": "ops/sec",
            "extra": "Samples: 1409\nMean: 0.354988ms\nP99: 0.614718ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry Overhead Analysis - proposed: state-in-atom direct access",
            "value": 357323.74058294395,
            "range": "0.29",
            "unit": "ops/sec",
            "extra": "Samples: 178662\nMean: 0.002799ms\nP99: 0.004749ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry.getStoresMap() overhead - direct Map access",
            "value": 171877.78721529682,
            "range": "0.32",
            "unit": "ops/sec",
            "extra": "Samples: 85939\nMean: 0.005818ms\nP99: 0.008325ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > Memory comparison - current: atomRegistry + store state",
            "value": 90.98291419393664,
            "range": "3.87",
            "unit": "ops/sec",
            "extra": "Samples: 46\nMean: 10.991075ms\nP99: 15.534727ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > Memory comparison - proposed: state-in-atom only",
            "value": 106169.00264838993,
            "range": "3.30",
            "unit": "ops/sec",
            "extra": "Samples: 53085\nMean: 0.009419ms\nP99: 0.031619ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - batch with computed atoms",
            "value": 49847.37814753963,
            "range": "17.41",
            "unit": "ops/sec",
            "extra": "Samples: 25312\nMean: 0.020061ms\nP99: 0.119353ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - batch: 100 sets, single notification",
            "value": 1401.6486487332509,
            "range": "10.18",
            "unit": "ops/sec",
            "extra": "Samples: 701\nMean: 0.713446ms\nP99: 4.587449ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - nested batch calls",
            "value": 6850.652928711767,
            "range": "12.79",
            "unit": "ops/sec",
            "extra": "Samples: 3426\nMean: 0.145971ms\nP99: 0.170208ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - no batch: 100 sets, multiple notifications",
            "value": 1387.5586474954318,
            "range": "10.99",
            "unit": "ops/sec",
            "extra": "Samples: 697\nMean: 0.720690ms\nP99: 4.883846ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - atom with function update",
            "value": 2508.1022936629397,
            "range": "3.35",
            "unit": "ops/sec",
            "extra": "Samples: 1256\nMean: 0.398708ms\nP99: 1.344994ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - concurrent subscriptions to same atom",
            "value": 35702.58260748097,
            "range": "4.72",
            "unit": "ops/sec",
            "extra": "Samples: 17852\nMean: 0.028009ms\nP99: 0.044853ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - rapid set/get cycles",
            "value": 2317.155054044075,
            "range": "3.06",
            "unit": "ops/sec",
            "extra": "Samples: 1159\nMean: 0.431564ms\nP99: 1.280653ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - create and cleanup 1000 atoms",
            "value": 487.2348882337179,
            "range": "14.62",
            "unit": "ops/sec",
            "extra": "Samples: 244\nMean: 2.052398ms\nP99: 9.331759ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - dynamic atoms with subscriptions",
            "value": 3415.8302742256105,
            "range": "12.34",
            "unit": "ops/sec",
            "extra": "Samples: 1708\nMean: 0.292755ms\nP99: 5.643305ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - subscribe and unsubscribe 1000 times",
            "value": 6034.683099384338,
            "range": "3.02",
            "unit": "ops/sec",
            "extra": "Samples: 3018\nMean: 0.165709ms\nP99: 1.003636ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - 100 subscribers, 100 updates",
            "value": 5769.969361462426,
            "range": "3.23",
            "unit": "ops/sec",
            "extra": "Samples: 2885\nMean: 0.173311ms\nP99: 1.379568ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - 1000 subscribers, single update",
            "value": 4244.55298095432,
            "range": "13.37",
            "unit": "ops/sec",
            "extra": "Samples: 2123\nMean: 0.235596ms\nP99: 5.180301ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - complex dependency graph",
            "value": 356.32637137891726,
            "range": "1.81",
            "unit": "ops/sec",
            "extra": "Samples: 179\nMean: 2.806416ms\nP99: 4.946514ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 1 dependency",
            "value": 1369.2964253721188,
            "range": "0.76",
            "unit": "ops/sec",
            "extra": "Samples: 685\nMean: 0.730302ms\nP99: 0.984500ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 10 dependencies",
            "value": 97.51610558088584,
            "range": "0.39",
            "unit": "ops/sec",
            "extra": "Samples: 49\nMean: 10.254716ms\nP99: 10.627410ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 5 dependencies",
            "value": 232.21078110000732,
            "range": "0.50",
            "unit": "ops/sec",
            "extra": "Samples: 117\nMean: 4.306432ms\nP99: 4.579839ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - create 1000 primitive atoms",
            "value": 11861.843826964194,
            "range": "1.73",
            "unit": "ops/sec",
            "extra": "Samples: 5931\nMean: 0.084304ms\nP99: 0.220342ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - diamond dependency pattern",
            "value": 741.6434504613294,
            "range": "1.02",
            "unit": "ops/sec",
            "extra": "Samples: 371\nMean: 1.348357ms\nP99: 1.749108ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - get primitive atom - 10000 iterations",
            "value": 3263.7785983150234,
            "range": "1.65",
            "unit": "ops/sec",
            "extra": "Samples: 1632\nMean: 0.306393ms\nP99: 0.585824ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - nested computed atoms (chain of 10)",
            "value": 286.91391206049093,
            "range": "1.09",
            "unit": "ops/sec",
            "extra": "Samples: 144\nMean: 3.485366ms\nP99: 3.858000ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - nested computed atoms (chain of 5)",
            "value": 588.8815337696193,
            "range": "1.04",
            "unit": "ops/sec",
            "extra": "Samples: 295\nMean: 1.698134ms\nP99: 2.182198ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - set primitive atom - 10000 iterations",
            "value": 310.46223769291765,
            "range": "0.61",
            "unit": "ops/sec",
            "extra": "Samples: 156\nMean: 3.221004ms\nP99: 3.614515ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - subscribe and update - 1000 iterations",
            "value": 2862.87486727417,
            "range": "0.89",
            "unit": "ops/sec",
            "extra": "Samples: 1432\nMean: 0.349299ms\nP99: 0.575766ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Writable Atom Performance - writable atom with multiple operations",
            "value": 2274.4298428092034,
            "range": "3.17",
            "unit": "ops/sec",
            "extra": "Samples: 1138\nMean: 0.439671ms\nP99: 1.362456ms"
          }
        ]
      }
    ]
  }
}