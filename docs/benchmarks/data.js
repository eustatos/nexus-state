window.BENCHMARK_DATA = {
  "lastUpdate": 1774536105288,
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
          "id": "02d0bc6cab04c3b469ad1f2e17393b3f6366afe7",
          "message": "feat(core): Add public methods getRegistryAtoms() and getRegistry()",
          "timestamp": "2026-03-26T11:23:55Z",
          "url": "https://github.com/eustatos/nexus-state/pull/73/commits/02d0bc6cab04c3b469ad1f2e17393b3f6366afe7"
        },
        "date": 1774528891217,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry Overhead Analysis - current: set() with atomRegistry lookup",
            "value": 2714.5881915441564,
            "range": "1.71",
            "unit": "ops/sec",
            "extra": "Samples: 1358\nMean: 0.368380ms\nP99: 0.737792ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry Overhead Analysis - proposed: state-in-atom direct access",
            "value": 358209.7922383682,
            "range": "0.58",
            "unit": "ops/sec",
            "extra": "Samples: 179105\nMean: 0.002792ms\nP99: 0.004558ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry.getStoresMap() overhead - direct Map access",
            "value": 172170.10888354343,
            "range": "0.33",
            "unit": "ops/sec",
            "extra": "Samples: 86086\nMean: 0.005808ms\nP99: 0.010781ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > Memory comparison - current: atomRegistry + store state",
            "value": 85.34638003993965,
            "range": "7.34",
            "unit": "ops/sec",
            "extra": "Samples: 43\nMean: 11.716959ms\nP99: 24.966743ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > Memory comparison - proposed: state-in-atom only",
            "value": 104007.25634811424,
            "range": "2.73",
            "unit": "ops/sec",
            "extra": "Samples: 52004\nMean: 0.009615ms\nP99: 0.032702ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - batch with computed atoms",
            "value": 65412.710061336635,
            "range": "14.62",
            "unit": "ops/sec",
            "extra": "Samples: 32707\nMean: 0.015288ms\nP99: 0.118322ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - batch: 100 sets, single notification",
            "value": 1365.048782136704,
            "range": "10.62",
            "unit": "ops/sec",
            "extra": "Samples: 683\nMean: 0.732575ms\nP99: 4.864389ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - nested batch calls",
            "value": 5390.876186192578,
            "range": "15.32",
            "unit": "ops/sec",
            "extra": "Samples: 2716\nMean: 0.185499ms\nP99: 5.902166ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - no batch: 100 sets, multiple notifications",
            "value": 1343.7145977069451,
            "range": "11.27",
            "unit": "ops/sec",
            "extra": "Samples: 672\nMean: 0.744206ms\nP99: 5.078644ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - atom with function update",
            "value": 2325.2826503022484,
            "range": "4.36",
            "unit": "ops/sec",
            "extra": "Samples: 1163\nMean: 0.430055ms\nP99: 1.784027ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - concurrent subscriptions to same atom",
            "value": 29810.426607425088,
            "range": "8.24",
            "unit": "ops/sec",
            "extra": "Samples: 14919\nMean: 0.033545ms\nP99: 0.049392ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - rapid set/get cycles",
            "value": 1917.8118933382027,
            "range": "6.22",
            "unit": "ops/sec",
            "extra": "Samples: 959\nMean: 0.521428ms\nP99: 2.586435ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - create and cleanup 1000 atoms",
            "value": 447.78821785532784,
            "range": "20.22",
            "unit": "ops/sec",
            "extra": "Samples: 228\nMean: 2.233199ms\nP99: 9.457435ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - dynamic atoms with subscriptions",
            "value": 3344.583761875383,
            "range": "12.62",
            "unit": "ops/sec",
            "extra": "Samples: 1674\nMean: 0.298991ms\nP99: 5.836502ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - subscribe and unsubscribe 1000 times",
            "value": 5666.721451639635,
            "range": "3.99",
            "unit": "ops/sec",
            "extra": "Samples: 2834\nMean: 0.176469ms\nP99: 1.388692ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - 100 subscribers, 100 updates",
            "value": 5599.355178257777,
            "range": "3.06",
            "unit": "ops/sec",
            "extra": "Samples: 2800\nMean: 0.178592ms\nP99: 0.797453ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - 1000 subscribers, single update",
            "value": 4422.190138040381,
            "range": "12.51",
            "unit": "ops/sec",
            "extra": "Samples: 2215\nMean: 0.226132ms\nP99: 4.372381ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - complex dependency graph",
            "value": 341.2447237354443,
            "range": "1.84",
            "unit": "ops/sec",
            "extra": "Samples: 171\nMean: 2.930448ms\nP99: 4.676419ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 1 dependency",
            "value": 1332.105862688579,
            "range": "0.88",
            "unit": "ops/sec",
            "extra": "Samples: 667\nMean: 0.750691ms\nP99: 1.033977ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 10 dependencies",
            "value": 96.98671692093424,
            "range": "0.90",
            "unit": "ops/sec",
            "extra": "Samples: 49\nMean: 10.310690ms\nP99: 11.878350ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 5 dependencies",
            "value": 227.48132347404862,
            "range": "0.55",
            "unit": "ops/sec",
            "extra": "Samples: 114\nMean: 4.395965ms\nP99: 4.602662ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - create 1000 primitive atoms",
            "value": 12086.379699937528,
            "range": "1.82",
            "unit": "ops/sec",
            "extra": "Samples: 6044\nMean: 0.082738ms\nP99: 0.219200ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - diamond dependency pattern",
            "value": 717.776048130773,
            "range": "1.25",
            "unit": "ops/sec",
            "extra": "Samples: 359\nMean: 1.393192ms\nP99: 1.944022ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - get primitive atom - 10000 iterations",
            "value": 3286.464944807699,
            "range": "1.55",
            "unit": "ops/sec",
            "extra": "Samples: 1644\nMean: 0.304278ms\nP99: 0.567974ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - nested computed atoms (chain of 10)",
            "value": 273.6098274610616,
            "range": "1.12",
            "unit": "ops/sec",
            "extra": "Samples: 137\nMean: 3.654839ms\nP99: 4.472828ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - nested computed atoms (chain of 5)",
            "value": 554.1925541870038,
            "range": "1.49",
            "unit": "ops/sec",
            "extra": "Samples: 278\nMean: 1.804427ms\nP99: 2.522846ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - set primitive atom - 10000 iterations",
            "value": 293.7751703368404,
            "range": "0.62",
            "unit": "ops/sec",
            "extra": "Samples: 147\nMean: 3.403964ms\nP99: 3.727803ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - subscribe and update - 1000 iterations",
            "value": 2843.489138741226,
            "range": "0.95",
            "unit": "ops/sec",
            "extra": "Samples: 1422\nMean: 0.351681ms\nP99: 0.595766ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Writable Atom Performance - writable atom with multiple operations",
            "value": 2044.8539022340242,
            "range": "6.18",
            "unit": "ops/sec",
            "extra": "Samples: 1026\nMean: 0.489032ms\nP99: 2.663209ms"
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
          "id": "ac87ce2cb937ec8d98caa91a7793a69eeaf239a1",
          "message": "feat(core): Add public methods getRegistryAtoms() and getRegistry() \n\n- Add getRegistryAtoms() method to Store interface and StoreImpl\n- Add getRegistry() method to Store interface and StoreImpl\n- Add comprehensive tests for both methods\n- Tests verify store isolation and atom tracking\n\nCloses #69",
          "timestamp": "2026-03-26T17:57:57+04:00",
          "tree_id": "b1cc18c6ea1a01b331c0e2e8c4b98a6f3a32252f",
          "url": "https://github.com/eustatos/nexus-state/commit/ac87ce2cb937ec8d98caa91a7793a69eeaf239a1"
        },
        "date": 1774533571638,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry Overhead Analysis - current: set() with atomRegistry lookup",
            "value": 2988.1368130292517,
            "range": "1.15",
            "unit": "ops/sec",
            "extra": "Samples: 1495\nMean: 0.334657ms\nP99: 0.559964ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry Overhead Analysis - proposed: state-in-atom direct access",
            "value": 372823.0060538533,
            "range": "0.34",
            "unit": "ops/sec",
            "extra": "Samples: 186412\nMean: 0.002682ms\nP99: 0.004947ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry.getStoresMap() overhead - direct Map access",
            "value": 166017.0467301134,
            "range": "0.30",
            "unit": "ops/sec",
            "extra": "Samples: 83009\nMean: 0.006023ms\nP99: 0.009614ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > Memory comparison - current: atomRegistry + store state",
            "value": 103.89167267823709,
            "range": "4.35",
            "unit": "ops/sec",
            "extra": "Samples: 53\nMean: 9.625411ms\nP99: 14.453246ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > Memory comparison - proposed: state-in-atom only",
            "value": 96939.11766014321,
            "range": "3.67",
            "unit": "ops/sec",
            "extra": "Samples: 48470\nMean: 0.010316ms\nP99: 0.032157ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - batch with computed atoms",
            "value": 48968.86966973371,
            "range": "23.32",
            "unit": "ops/sec",
            "extra": "Samples: 24490\nMean: 0.020421ms\nP99: 0.117924ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - batch: 100 sets, single notification",
            "value": 1387.7966711340691,
            "range": "10.46",
            "unit": "ops/sec",
            "extra": "Samples: 694\nMean: 0.720567ms\nP99: 4.638781ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - nested batch calls",
            "value": 6424.079468903072,
            "range": "12.83",
            "unit": "ops/sec",
            "extra": "Samples: 3225\nMean: 0.155664ms\nP99: 0.214756ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - no batch: 100 sets, multiple notifications",
            "value": 1384.1631919015983,
            "range": "11.36",
            "unit": "ops/sec",
            "extra": "Samples: 696\nMean: 0.722458ms\nP99: 4.794881ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - atom with function update",
            "value": 2521.074201047536,
            "range": "4.28",
            "unit": "ops/sec",
            "extra": "Samples: 1261\nMean: 0.396656ms\nP99: 1.504876ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - concurrent subscriptions to same atom",
            "value": 33803.28032816573,
            "range": "5.60",
            "unit": "ops/sec",
            "extra": "Samples: 16902\nMean: 0.029583ms\nP99: 0.044266ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - rapid set/get cycles",
            "value": 2359.490652033894,
            "range": "4.25",
            "unit": "ops/sec",
            "extra": "Samples: 1180\nMean: 0.423820ms\nP99: 1.506579ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - create and cleanup 1000 atoms",
            "value": 430.147387586457,
            "range": "19.23",
            "unit": "ops/sec",
            "extra": "Samples: 219\nMean: 2.324785ms\nP99: 9.396267ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - dynamic atoms with subscriptions",
            "value": 3233.245211188819,
            "range": "12.40",
            "unit": "ops/sec",
            "extra": "Samples: 1622\nMean: 0.309287ms\nP99: 5.813961ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - subscribe and unsubscribe 1000 times",
            "value": 6454.383254447678,
            "range": "3.86",
            "unit": "ops/sec",
            "extra": "Samples: 3228\nMean: 0.154933ms\nP99: 1.251954ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - 100 subscribers, 100 updates",
            "value": 5452.2826618163135,
            "range": "2.58",
            "unit": "ops/sec",
            "extra": "Samples: 2727\nMean: 0.183409ms\nP99: 0.924191ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - 1000 subscribers, single update",
            "value": 4307.438120541771,
            "range": "12.54",
            "unit": "ops/sec",
            "extra": "Samples: 2154\nMean: 0.232157ms\nP99: 4.669916ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - complex dependency graph",
            "value": 377.1735426138507,
            "range": "1.63",
            "unit": "ops/sec",
            "extra": "Samples: 189\nMean: 2.651299ms\nP99: 4.462802ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 1 dependency",
            "value": 1511.3806211076815,
            "range": "0.75",
            "unit": "ops/sec",
            "extra": "Samples: 756\nMean: 0.661647ms\nP99: 0.866746ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 10 dependencies",
            "value": 101.73938987282874,
            "range": "0.80",
            "unit": "ops/sec",
            "extra": "Samples: 51\nMean: 9.829035ms\nP99: 11.281231ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 5 dependencies",
            "value": 245.0011059907665,
            "range": "0.66",
            "unit": "ops/sec",
            "extra": "Samples: 123\nMean: 4.081614ms\nP99: 4.559023ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - create 1000 primitive atoms",
            "value": 12729.446498207333,
            "range": "1.72",
            "unit": "ops/sec",
            "extra": "Samples: 6365\nMean: 0.078558ms\nP99: 0.194677ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - diamond dependency pattern",
            "value": 788.1347640133082,
            "range": "1.24",
            "unit": "ops/sec",
            "extra": "Samples: 395\nMean: 1.268819ms\nP99: 1.711420ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - get primitive atom - 10000 iterations",
            "value": 3136.901231331904,
            "range": "1.53",
            "unit": "ops/sec",
            "extra": "Samples: 1569\nMean: 0.318786ms\nP99: 0.586914ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - nested computed atoms (chain of 10)",
            "value": 315.84862575592103,
            "range": "1.15",
            "unit": "ops/sec",
            "extra": "Samples: 158\nMean: 3.166074ms\nP99: 3.652678ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - nested computed atoms (chain of 5)",
            "value": 643.7209433359411,
            "range": "1.08",
            "unit": "ops/sec",
            "extra": "Samples: 323\nMean: 1.553468ms\nP99: 1.938163ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - set primitive atom - 10000 iterations",
            "value": 326.69350562713333,
            "range": "0.64",
            "unit": "ops/sec",
            "extra": "Samples: 164\nMean: 3.060973ms\nP99: 3.605119ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - subscribe and update - 1000 iterations",
            "value": 2992.63032696666,
            "range": "0.97",
            "unit": "ops/sec",
            "extra": "Samples: 1497\nMean: 0.334154ms\nP99: 0.570250ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Writable Atom Performance - writable atom with multiple operations",
            "value": 2275.181658110851,
            "range": "4.10",
            "unit": "ops/sec",
            "extra": "Samples: 1138\nMean: 0.439525ms\nP99: 1.578344ms"
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
          "id": "402ad80d16f09549a832f61910f61d070cfeeabc",
          "message": "fix(time-travel): Use store-specific registry in capture() and flushC…",
          "timestamp": "2026-03-26T13:59:07Z",
          "url": "https://github.com/eustatos/nexus-state/pull/74/commits/402ad80d16f09549a832f61910f61d070cfeeabc"
        },
        "date": 1774535135945,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry Overhead Analysis - current: set() with atomRegistry lookup",
            "value": 2837.265205057189,
            "range": "1.18",
            "unit": "ops/sec",
            "extra": "Samples: 1419\nMean: 0.352452ms\nP99: 0.602984ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry Overhead Analysis - proposed: state-in-atom direct access",
            "value": 494736.79976855824,
            "range": "0.38",
            "unit": "ops/sec",
            "extra": "Samples: 247369\nMean: 0.002021ms\nP99: 0.003368ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry.getStoresMap() overhead - direct Map access",
            "value": 178713.70476496202,
            "range": "0.25",
            "unit": "ops/sec",
            "extra": "Samples: 89357\nMean: 0.005596ms\nP99: 0.009802ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > Memory comparison - current: atomRegistry + store state",
            "value": 86.50352568317575,
            "range": "7.49",
            "unit": "ops/sec",
            "extra": "Samples: 44\nMean: 11.560222ms\nP99: 18.404813ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > Memory comparison - proposed: state-in-atom only",
            "value": 72517.94546651306,
            "range": "2.63",
            "unit": "ops/sec",
            "extra": "Samples: 36259\nMean: 0.013790ms\nP99: 0.040216ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - batch with computed atoms",
            "value": 44407.86927439868,
            "range": "30.66",
            "unit": "ops/sec",
            "extra": "Samples: 22208\nMean: 0.022519ms\nP99: 0.138843ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - batch: 100 sets, single notification",
            "value": 1305.0987118805504,
            "range": "10.98",
            "unit": "ops/sec",
            "extra": "Samples: 653\nMean: 0.766226ms\nP99: 5.007014ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - nested batch calls",
            "value": 5893.264532373034,
            "range": "13.43",
            "unit": "ops/sec",
            "extra": "Samples: 2947\nMean: 0.169685ms\nP99: 3.191676ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - no batch: 100 sets, multiple notifications",
            "value": 1315.8472088793933,
            "range": "11.79",
            "unit": "ops/sec",
            "extra": "Samples: 664\nMean: 0.759967ms\nP99: 5.214680ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - atom with function update",
            "value": 1946.6816604590585,
            "range": "7.15",
            "unit": "ops/sec",
            "extra": "Samples: 974\nMean: 0.513695ms\nP99: 2.658807ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - concurrent subscriptions to same atom",
            "value": 31276.557712814767,
            "range": "7.59",
            "unit": "ops/sec",
            "extra": "Samples: 15639\nMean: 0.031973ms\nP99: 0.044043ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - rapid set/get cycles",
            "value": 1995.5738811179413,
            "range": "5.03",
            "unit": "ops/sec",
            "extra": "Samples: 998\nMean: 0.501109ms\nP99: 1.985496ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - create and cleanup 1000 atoms",
            "value": 432.51646432408984,
            "range": "21.83",
            "unit": "ops/sec",
            "extra": "Samples: 220\nMean: 2.312051ms\nP99: 9.735321ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - dynamic atoms with subscriptions",
            "value": 3177.78495929178,
            "range": "12.59",
            "unit": "ops/sec",
            "extra": "Samples: 1589\nMean: 0.314685ms\nP99: 6.003878ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - subscribe and unsubscribe 1000 times",
            "value": 5265.653425222097,
            "range": "6.41",
            "unit": "ops/sec",
            "extra": "Samples: 2633\nMean: 0.189910ms\nP99: 2.204901ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - 100 subscribers, 100 updates",
            "value": 5729.437564032382,
            "range": "3.52",
            "unit": "ops/sec",
            "extra": "Samples: 2865\nMean: 0.174537ms\nP99: 1.630321ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - 1000 subscribers, single update",
            "value": 4026.324737273457,
            "range": "12.74",
            "unit": "ops/sec",
            "extra": "Samples: 2032\nMean: 0.248365ms\nP99: 4.747834ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - complex dependency graph",
            "value": 350.1235262656654,
            "range": "1.93",
            "unit": "ops/sec",
            "extra": "Samples: 176\nMean: 2.856135ms\nP99: 4.814706ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 1 dependency",
            "value": 1306.1992919429154,
            "range": "1.00",
            "unit": "ops/sec",
            "extra": "Samples: 654\nMean: 0.765580ms\nP99: 1.089203ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 10 dependencies",
            "value": 91.29601315589827,
            "range": "0.57",
            "unit": "ops/sec",
            "extra": "Samples: 46\nMean: 10.953381ms\nP99: 11.573391ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 5 dependencies",
            "value": 209.54335599414475,
            "range": "0.64",
            "unit": "ops/sec",
            "extra": "Samples: 105\nMean: 4.772282ms\nP99: 5.159601ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - create 1000 primitive atoms",
            "value": 12429.95945347233,
            "range": "2.08",
            "unit": "ops/sec",
            "extra": "Samples: 6215\nMean: 0.080451ms\nP99: 0.230867ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - diamond dependency pattern",
            "value": 673.6840394907375,
            "range": "1.70",
            "unit": "ops/sec",
            "extra": "Samples: 337\nMean: 1.484375ms\nP99: 2.081255ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - get primitive atom - 10000 iterations",
            "value": 2776.4952078871406,
            "range": "1.39",
            "unit": "ops/sec",
            "extra": "Samples: 1390\nMean: 0.360166ms\nP99: 0.638875ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - nested computed atoms (chain of 10)",
            "value": 277.0415923419491,
            "range": "1.42",
            "unit": "ops/sec",
            "extra": "Samples: 139\nMean: 3.609566ms\nP99: 4.193962ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - nested computed atoms (chain of 5)",
            "value": 552.1576883261896,
            "range": "1.64",
            "unit": "ops/sec",
            "extra": "Samples: 277\nMean: 1.811077ms\nP99: 2.428011ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - set primitive atom - 10000 iterations",
            "value": 310.92116821788795,
            "range": "0.52",
            "unit": "ops/sec",
            "extra": "Samples: 156\nMean: 3.216249ms\nP99: 3.409892ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - subscribe and update - 1000 iterations",
            "value": 2712.832716912972,
            "range": "1.07",
            "unit": "ops/sec",
            "extra": "Samples: 1357\nMean: 0.368618ms\nP99: 0.650981ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Writable Atom Performance - writable atom with multiple operations",
            "value": 2102.001757233423,
            "range": "5.13",
            "unit": "ops/sec",
            "extra": "Samples: 1053\nMean: 0.475737ms\nP99: 2.200870ms"
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
          "id": "2947df30853f2e2fa6add065dcc76c1527661fca",
          "message": "fix(time-travel): Use store-specific registry in capture() and flushC… \n\n* fix(time-travel): Use store-specific registry in capture() and flushComputed()\n\n- Replace atomRegistry.getAll() with store.getRegistryAtoms() for filtering\n- Only initialize atoms that belong to the current store\n- Update flushComputed() to use store-specific registry\n- Add tests for store isolation (SSR safety)\n\nThis ensures proper isolation in SSR environments where multiple stores\nmay exist concurrently. The change prevents atoms from one store leaking\ninto another store's time-travel snapshots.\n\nCloses #66\n\n* fix: remove unused getAtomById method",
          "timestamp": "2026-03-26T18:26:36+04:00",
          "tree_id": "75c3bfe1f3fb872475757d08c1c731508b8a0938",
          "url": "https://github.com/eustatos/nexus-state/commit/2947df30853f2e2fa6add065dcc76c1527661fca"
        },
        "date": 1774535315267,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry Overhead Analysis - current: set() with atomRegistry lookup",
            "value": 2788.262633553041,
            "range": "1.10",
            "unit": "ops/sec",
            "extra": "Samples: 1395\nMean: 0.358646ms\nP99: 0.557082ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry Overhead Analysis - proposed: state-in-atom direct access",
            "value": 355063.3949719526,
            "range": "0.34",
            "unit": "ops/sec",
            "extra": "Samples: 177532\nMean: 0.002816ms\nP99: 0.004609ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry.getStoresMap() overhead - direct Map access",
            "value": 171649.3058501893,
            "range": "0.22",
            "unit": "ops/sec",
            "extra": "Samples: 85825\nMean: 0.005826ms\nP99: 0.011372ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > Memory comparison - current: atomRegistry + store state",
            "value": 90.87433811972154,
            "range": "3.77",
            "unit": "ops/sec",
            "extra": "Samples: 46\nMean: 11.004207ms\nP99: 15.677341ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > Memory comparison - proposed: state-in-atom only",
            "value": 95493.29315864827,
            "range": "1.90",
            "unit": "ops/sec",
            "extra": "Samples: 47747\nMean: 0.010472ms\nP99: 0.035096ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - batch with computed atoms",
            "value": 54133.448091753955,
            "range": "19.66",
            "unit": "ops/sec",
            "extra": "Samples: 27072\nMean: 0.018473ms\nP99: 0.122088ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - batch: 100 sets, single notification",
            "value": 1352.8954961169459,
            "range": "10.71",
            "unit": "ops/sec",
            "extra": "Samples: 677\nMean: 0.739155ms\nP99: 4.829436ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - nested batch calls",
            "value": 6309.561813550632,
            "range": "13.49",
            "unit": "ops/sec",
            "extra": "Samples: 3155\nMean: 0.158490ms\nP99: 0.228327ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - no batch: 100 sets, multiple notifications",
            "value": 1315.0560448805138,
            "range": "11.23",
            "unit": "ops/sec",
            "extra": "Samples: 658\nMean: 0.760424ms\nP99: 5.131608ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - atom with function update",
            "value": 2228.9479454856114,
            "range": "5.35",
            "unit": "ops/sec",
            "extra": "Samples: 1115\nMean: 0.448642ms\nP99: 2.275797ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - concurrent subscriptions to same atom",
            "value": 30207.697387155884,
            "range": "7.78",
            "unit": "ops/sec",
            "extra": "Samples: 15160\nMean: 0.033104ms\nP99: 0.047880ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - rapid set/get cycles",
            "value": 1957.2618930529973,
            "range": "6.61",
            "unit": "ops/sec",
            "extra": "Samples: 979\nMean: 0.510918ms\nP99: 2.794708ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - create and cleanup 1000 atoms",
            "value": 439.38572118637177,
            "range": "20.50",
            "unit": "ops/sec",
            "extra": "Samples: 220\nMean: 2.275905ms\nP99: 9.324875ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - dynamic atoms with subscriptions",
            "value": 3356.9034943285,
            "range": "12.78",
            "unit": "ops/sec",
            "extra": "Samples: 1679\nMean: 0.297894ms\nP99: 5.863279ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - subscribe and unsubscribe 1000 times",
            "value": 5367.541440199935,
            "range": "5.56",
            "unit": "ops/sec",
            "extra": "Samples: 2684\nMean: 0.186305ms\nP99: 2.044004ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - 100 subscribers, 100 updates",
            "value": 5713.28983807287,
            "range": "3.63",
            "unit": "ops/sec",
            "extra": "Samples: 2857\nMean: 0.175031ms\nP99: 1.502200ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - 1000 subscribers, single update",
            "value": 4039.963558691498,
            "range": "12.81",
            "unit": "ops/sec",
            "extra": "Samples: 2027\nMean: 0.247527ms\nP99: 4.542195ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - complex dependency graph",
            "value": 340.4981111823069,
            "range": "1.89",
            "unit": "ops/sec",
            "extra": "Samples: 171\nMean: 2.936874ms\nP99: 4.727215ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 1 dependency",
            "value": 1350.4794330842524,
            "range": "0.78",
            "unit": "ops/sec",
            "extra": "Samples: 676\nMean: 0.740478ms\nP99: 1.002384ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 10 dependencies",
            "value": 96.39615442060376,
            "range": "0.63",
            "unit": "ops/sec",
            "extra": "Samples: 49\nMean: 10.373858ms\nP99: 10.787456ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 5 dependencies",
            "value": 230.237573279782,
            "range": "0.52",
            "unit": "ops/sec",
            "extra": "Samples: 116\nMean: 4.343340ms\nP99: 4.841325ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - create 1000 primitive atoms",
            "value": 11968.131870360041,
            "range": "1.91",
            "unit": "ops/sec",
            "extra": "Samples: 5985\nMean: 0.083555ms\nP99: 0.222426ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - diamond dependency pattern",
            "value": 714.3178286584711,
            "range": "1.54",
            "unit": "ops/sec",
            "extra": "Samples: 358\nMean: 1.399937ms\nP99: 1.923408ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - get primitive atom - 10000 iterations",
            "value": 3240.4346432368807,
            "range": "1.52",
            "unit": "ops/sec",
            "extra": "Samples: 1621\nMean: 0.308601ms\nP99: 0.533989ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - nested computed atoms (chain of 10)",
            "value": 269.2740339731224,
            "range": "1.37",
            "unit": "ops/sec",
            "extra": "Samples: 135\nMean: 3.713689ms\nP99: 4.451799ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - nested computed atoms (chain of 5)",
            "value": 527.31937931771,
            "range": "2.24",
            "unit": "ops/sec",
            "extra": "Samples: 265\nMean: 1.896384ms\nP99: 3.106790ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - set primitive atom - 10000 iterations",
            "value": 311.23084587366736,
            "range": "0.65",
            "unit": "ops/sec",
            "extra": "Samples: 156\nMean: 3.213049ms\nP99: 3.722852ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - subscribe and update - 1000 iterations",
            "value": 2821.3982183314097,
            "range": "0.96",
            "unit": "ops/sec",
            "extra": "Samples: 1411\nMean: 0.354434ms\nP99: 0.618607ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Writable Atom Performance - writable atom with multiple operations",
            "value": 2078.4899604159295,
            "range": "5.01",
            "unit": "ops/sec",
            "extra": "Samples: 1040\nMean: 0.481119ms\nP99: 2.109977ms"
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
          "id": "b47fce476f3232b76ee926f38b957adeba6be4a7",
          "message": "fix(core): setState searches atoms in local store registry during hyd…",
          "timestamp": "2026-03-26T14:27:35Z",
          "url": "https://github.com/eustatos/nexus-state/pull/75/commits/b47fce476f3232b76ee926f38b957adeba6be4a7"
        },
        "date": 1774536104648,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry Overhead Analysis - current: set() with atomRegistry lookup",
            "value": 2759.2687551501367,
            "range": "1.68",
            "unit": "ops/sec",
            "extra": "Samples: 1380\nMean: 0.362415ms\nP99: 0.776776ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry Overhead Analysis - proposed: state-in-atom direct access",
            "value": 354511.77453058504,
            "range": "0.47",
            "unit": "ops/sec",
            "extra": "Samples: 177256\nMean: 0.002821ms\nP99: 0.004949ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > atomRegistry.getStoresMap() overhead - direct Map access",
            "value": 171967.09510914786,
            "range": "0.35",
            "unit": "ops/sec",
            "extra": "Samples: 85984\nMean: 0.005815ms\nP99: 0.008116ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > Memory comparison - current: atomRegistry + store state",
            "value": 87.0260367958149,
            "range": "5.71",
            "unit": "ops/sec",
            "extra": "Samples: 44\nMean: 11.490814ms\nP99: 17.234128ms"
          },
          {
            "name": "packages/core/__benchmarks__/registry-overhead.bench.ts > Memory comparison - proposed: state-in-atom only",
            "value": 105757.38935684855,
            "range": "2.41",
            "unit": "ops/sec",
            "extra": "Samples: 52879\nMean: 0.009456ms\nP99: 0.032420ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - batch with computed atoms",
            "value": 74310.49971429576,
            "range": "12.97",
            "unit": "ops/sec",
            "extra": "Samples: 37162\nMean: 0.013457ms\nP99: 0.115997ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - batch: 100 sets, single notification",
            "value": 1400.8420695486807,
            "range": "10.38",
            "unit": "ops/sec",
            "extra": "Samples: 701\nMean: 0.713856ms\nP99: 4.733180ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - nested batch calls",
            "value": 4837.687562786552,
            "range": "16.92",
            "unit": "ops/sec",
            "extra": "Samples: 2419\nMean: 0.206710ms\nP99: 6.311829ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Batching Performance - no batch: 100 sets, multiple notifications",
            "value": 1355.7748546045684,
            "range": "11.47",
            "unit": "ops/sec",
            "extra": "Samples: 678\nMean: 0.737586ms\nP99: 5.084208ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - atom with function update",
            "value": 2587.9401171823256,
            "range": "2.94",
            "unit": "ops/sec",
            "extra": "Samples: 1296\nMean: 0.386408ms\nP99: 1.180684ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - concurrent subscriptions to same atom",
            "value": 32662.575062488126,
            "range": "5.90",
            "unit": "ops/sec",
            "extra": "Samples: 16332\nMean: 0.030616ms\nP99: 0.045696ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Edge Cases - rapid set/get cycles",
            "value": 2362.4725528209756,
            "range": "2.80",
            "unit": "ops/sec",
            "extra": "Samples: 1182\nMean: 0.423285ms\nP99: 1.138654ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - create and cleanup 1000 atoms",
            "value": 391.02129871468566,
            "range": "27.37",
            "unit": "ops/sec",
            "extra": "Samples: 196\nMean: 2.557405ms\nP99: 10.416991ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - dynamic atoms with subscriptions",
            "value": 2789.044623919839,
            "range": "15.33",
            "unit": "ops/sec",
            "extra": "Samples: 1395\nMean: 0.358546ms\nP99: 7.427722ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Memory Performance - subscribe and unsubscribe 1000 times",
            "value": 5525.606377904568,
            "range": "4.94",
            "unit": "ops/sec",
            "extra": "Samples: 2763\nMean: 0.180976ms\nP99: 1.736124ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - 100 subscribers, 100 updates",
            "value": 5683.177348712305,
            "range": "3.62",
            "unit": "ops/sec",
            "extra": "Samples: 2842\nMean: 0.175958ms\nP99: 1.441182ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - 1000 subscribers, single update",
            "value": 4588.7537420892695,
            "range": "13.72",
            "unit": "ops/sec",
            "extra": "Samples: 2297\nMean: 0.217924ms\nP99: 5.242718ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - complex dependency graph",
            "value": 345.8931404649678,
            "range": "1.95",
            "unit": "ops/sec",
            "extra": "Samples: 173\nMean: 2.891066ms\nP99: 4.713974ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 1 dependency",
            "value": 1368.4319548758424,
            "range": "0.72",
            "unit": "ops/sec",
            "extra": "Samples: 685\nMean: 0.730763ms\nP99: 0.962775ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 10 dependencies",
            "value": 95.65594107621155,
            "range": "1.07",
            "unit": "ops/sec",
            "extra": "Samples: 48\nMean: 10.454134ms\nP99: 11.393630ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - computed atom with 5 dependencies",
            "value": 228.42327317969196,
            "range": "0.67",
            "unit": "ops/sec",
            "extra": "Samples: 115\nMean: 4.377838ms\nP99: 4.768029ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - create 1000 primitive atoms",
            "value": 11683.9720052029,
            "range": "1.78",
            "unit": "ops/sec",
            "extra": "Samples: 5842\nMean: 0.085587ms\nP99: 0.249919ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - diamond dependency pattern",
            "value": 741.7032489803088,
            "range": "1.01",
            "unit": "ops/sec",
            "extra": "Samples: 371\nMean: 1.348248ms\nP99: 1.719354ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - get primitive atom - 10000 iterations",
            "value": 3263.74464461901,
            "range": "1.70",
            "unit": "ops/sec",
            "extra": "Samples: 1632\nMean: 0.306397ms\nP99: 0.554179ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - nested computed atoms (chain of 10)",
            "value": 287.0543402378109,
            "range": "0.89",
            "unit": "ops/sec",
            "extra": "Samples: 144\nMean: 3.483661ms\nP99: 3.986093ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - nested computed atoms (chain of 5)",
            "value": 581.351746294743,
            "range": "1.13",
            "unit": "ops/sec",
            "extra": "Samples: 291\nMean: 1.720129ms\nP99: 2.158076ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - set primitive atom - 10000 iterations",
            "value": 315.37555010328504,
            "range": "0.53",
            "unit": "ops/sec",
            "extra": "Samples: 158\nMean: 3.170823ms\nP99: 3.437324ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Store Performance - subscribe and update - 1000 iterations",
            "value": 2890.5319335172653,
            "range": "0.98",
            "unit": "ops/sec",
            "extra": "Samples: 1446\nMean: 0.345957ms\nP99: 0.616095ms"
          },
          {
            "name": "packages/core/__benchmarks__/store.bench.ts > Writable Atom Performance - writable atom with multiple operations",
            "value": 2208.793760057109,
            "range": "6.13",
            "unit": "ops/sec",
            "extra": "Samples: 1105\nMean: 0.452736ms\nP99: 3.281650ms"
          }
        ]
      }
    ]
  }
}