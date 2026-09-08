/**
 * S21 Verter Test Module: C2_SimpleBashUtils
 * 
 * Tests for s21_cat and s21_grep implementations.
 * This serves as an EXAMPLE of how to write test modules.
 */

export default {
  id: 'c-simplebashutils',
  name: 'C2_SimpleBashUtils Tests',
  version: '1.0.0',
  language: 'c',

  async setup(projectDir) {
    // Nothing special needed
  },

  suites: [
    // ═══════════════════ COMPILATION ═══════════════════
    {
      name: 'Compilation',
      tests: [
        {
          name: 'Makefile exists',
          async run(ctx) {
            await ctx.assertFileExists('Makefile', 'Makefile not found in project root');
          },
        },
        {
          name: 'Project compiles with make',
          timeout: 30000,
          async run(ctx) {
            const result = await ctx.exec('make');
            ctx.assert(result.exitCode === 0, `Compilation failed:\n${result.stderr}`);
          },
        },
        {
          name: 'make clean works',
          async run(ctx) {
            const result = await ctx.exec('make clean');
            ctx.assert(result.exitCode === 0, 'make clean failed');
          },
        },
        {
          name: 'Recompile after clean',
          timeout: 30000,
          async run(ctx) {
            const result = await ctx.exec('make');
            ctx.assert(result.exitCode === 0, `Recompilation failed:\n${result.stderr}`);
          },
        },
        {
          name: 'No compilation warnings with -Wall -Werror -Wextra',
          async run(ctx) {
            const makefile = await ctx.readFile('Makefile');
            ctx.assert(
              makefile.includes('-Wall') && makefile.includes('-Werror') && makefile.includes('-Wextra'),
              'Makefile must include -Wall -Werror -Wextra flags'
            );
          },
        },
      ],
    },

    // ═══════════════════ S21_CAT ═══════════════════
    {
      name: 's21_cat Functionality',
      tests: [
        {
          name: 's21_cat binary exists after make',
          async run(ctx) {
            const catExists = await ctx.fileExists('src/cat/s21_cat') ||
                              await ctx.fileExists('cat/s21_cat') ||
                              await ctx.fileExists('s21_cat');
            ctx.assert(catExists, 's21_cat binary not found');
          },
        },
        {
          name: 'cat: basic file output',
          async run(ctx) {
            await ctx.writeTempFile('test1.txt', 'Hello World\nSecond line\n');
            const catPath = await findBinary(ctx, 's21_cat');
            const s21 = await ctx.exec(`${catPath} .verter-tmp/test1.txt`);
            const sys = await ctx.exec(`cat .verter-tmp/test1.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, `Output mismatch:\ns21_cat: "${s21.stdout}"\ncat: "${sys.stdout}"`);
          },
        },
        {
          name: 'cat: -b flag (number non-blank lines)',
          async run(ctx) {
            await ctx.writeTempFile('test_b.txt', 'line1\n\nline3\n\nline5\n');
            const catPath = await findBinary(ctx, 's21_cat');
            const s21 = await ctx.exec(`${catPath} -b .verter-tmp/test_b.txt`);
            const sys = await ctx.exec(`cat -b .verter-tmp/test_b.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, `Flag -b output mismatch`);
          },
        },
        {
          name: 'cat: -n flag (number all lines)',
          async run(ctx) {
            await ctx.writeTempFile('test_n.txt', 'line1\nline2\nline3\n');
            const catPath = await findBinary(ctx, 's21_cat');
            const s21 = await ctx.exec(`${catPath} -n .verter-tmp/test_n.txt`);
            const sys = await ctx.exec(`cat -n .verter-tmp/test_n.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, `Flag -n output mismatch`);
          },
        },
        {
          name: 'cat: -s flag (squeeze blank lines)',
          async run(ctx) {
            await ctx.writeTempFile('test_s.txt', 'line1\n\n\n\nline2\n');
            const catPath = await findBinary(ctx, 's21_cat');
            const s21 = await ctx.exec(`${catPath} -s .verter-tmp/test_s.txt`);
            const sys = await ctx.exec(`cat -s .verter-tmp/test_s.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, `Flag -s output mismatch`);
          },
        },
        {
          name: 'cat: -e flag (show $ at end of lines)',
          async run(ctx) {
            await ctx.writeTempFile('test_e.txt', 'hello\nworld\n');
            const catPath = await findBinary(ctx, 's21_cat');
            const s21 = await ctx.exec(`${catPath} -e .verter-tmp/test_e.txt`);
            const sys = await ctx.exec(`cat -e .verter-tmp/test_e.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, `Flag -e output mismatch`);
          },
        },
        {
          name: 'cat: -E flag (show $ at end, no -v)',
          async run(ctx) {
            await ctx.writeTempFile('test_E.txt', 'hello\nworld\n');
            const catPath = await findBinary(ctx, 's21_cat');
            const s21 = await ctx.exec(`${catPath} -E .verter-tmp/test_E.txt`);
            const sys = await ctx.exec(`cat -E .verter-tmp/test_E.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, `Flag -E output mismatch`);
          },
        },
        {
          name: 'cat: -t flag (show tabs as ^I)',
          async run(ctx) {
            await ctx.writeTempFile('test_t.txt', 'hello\tworld\n');
            const catPath = await findBinary(ctx, 's21_cat');
            const s21 = await ctx.exec(`${catPath} -t .verter-tmp/test_t.txt`);
            const sys = await ctx.exec(`cat -t .verter-tmp/test_t.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, `Flag -t output mismatch`);
          },
        },
        {
          name: 'cat: -T flag (show tabs, no -v)',
          async run(ctx) {
            await ctx.writeTempFile('test_T.txt', 'hello\tworld\n');
            const catPath = await findBinary(ctx, 's21_cat');
            const s21 = await ctx.exec(`${catPath} -T .verter-tmp/test_T.txt`);
            const sys = await ctx.exec(`cat -T .verter-tmp/test_T.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, `Flag -T output mismatch`);
          },
        },
        {
          name: 'cat: -v flag (show non-printing)',
          async run(ctx) {
            // File with control char (0x01) and DEL (0x7F)
            await ctx.writeTempFile('test_v.txt', 'a\x01b\x7Fc\n');
            const catPath = await findBinary(ctx, 's21_cat');
            const s21 = await ctx.exec(`${catPath} -v .verter-tmp/test_v.txt`);
            const sys = await ctx.exec(`cat -v .verter-tmp/test_v.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, `Flag -v output mismatch`);
          },
        },
        {
          name: 'cat: combined flags -b -s',
          async run(ctx) {
            await ctx.writeTempFile('test_bs.txt', 'line1\n\n\n\nline2\n\nline3\n');
            const catPath = await findBinary(ctx, 's21_cat');
            const s21 = await ctx.exec(`${catPath} -b -s .verter-tmp/test_bs.txt`);
            const sys = await ctx.exec(`cat -b -s .verter-tmp/test_bs.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, `Combined -b -s mismatch`);
          },
        },
        {
          name: 'cat: multiple files',
          async run(ctx) {
            await ctx.writeTempFile('multi1.txt', 'file1\n');
            await ctx.writeTempFile('multi2.txt', 'file2\n');
            const catPath = await findBinary(ctx, 's21_cat');
            const s21 = await ctx.exec(`${catPath} .verter-tmp/multi1.txt .verter-tmp/multi2.txt`);
            const sys = await ctx.exec(`cat .verter-tmp/multi1.txt .verter-tmp/multi2.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, 'Multiple files output mismatch');
          },
        },
        {
          name: 'cat: stdin reading',
          async run(ctx) {
            const catPath = await findBinary(ctx, 's21_cat');
            const input = 'Hello from stdin\nSecond line\n';
            const s21 = await ctx.exec(`echo "${input}" | ${catPath}`);
            const sys = await ctx.exec(`echo "${input}" | cat`);
            ctx.assertEqual(s21.stdout, sys.stdout, 'Stdin output mismatch');
          },
        },
        {
          name: 'cat: nonexistent file returns error',
          async run(ctx) {
            const catPath = await findBinary(ctx, 's21_cat');
            const result = await ctx.exec(`${catPath} nonexistent_file_42.txt 2>&1`);
            ctx.assert(result.exitCode !== 0 || result.stderr.length > 0 || result.stdout.includes('No such file'),
              'Should return error for nonexistent file');
          },
        },
      ],
    },

    // ═══════════════════ S21_GREP ═══════════════════
    {
      name: 's21_grep Functionality',
      tests: [
        {
          name: 's21_grep binary exists after make',
          async run(ctx) {
            const grepExists = await ctx.fileExists('src/grep/s21_grep') ||
                               await ctx.fileExists('grep/s21_grep') ||
                               await ctx.fileExists('s21_grep');
            ctx.assert(grepExists, 's21_grep binary not found');
          },
        },
        {
          name: 'grep: basic pattern match',
          async run(ctx) {
            await ctx.writeTempFile('grep_test.txt', 'apple\nbanana\napricot\ncherry\n');
            const grepPath = await findBinary(ctx, 's21_grep');
            const s21 = await ctx.exec(`${grepPath} "ap" .verter-tmp/grep_test.txt`);
            const sys = await ctx.exec(`grep "ap" .verter-tmp/grep_test.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, 'Basic grep output mismatch');
          },
        },
        {
          name: 'grep: -e flag (explicit pattern)',
          async run(ctx) {
            await ctx.writeTempFile('grep_e.txt', 'apple\nbanana\napricot\n');
            const grepPath = await findBinary(ctx, 's21_grep');
            const s21 = await ctx.exec(`${grepPath} -e "ap" .verter-tmp/grep_e.txt`);
            const sys = await ctx.exec(`grep -e "ap" .verter-tmp/grep_e.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, 'Flag -e output mismatch');
          },
        },
        {
          name: 'grep: -i flag (case insensitive)',
          async run(ctx) {
            await ctx.writeTempFile('grep_i.txt', 'Apple\nBANANA\napple\n');
            const grepPath = await findBinary(ctx, 's21_grep');
            const s21 = await ctx.exec(`${grepPath} -i "apple" .verter-tmp/grep_i.txt`);
            const sys = await ctx.exec(`grep -i "apple" .verter-tmp/grep_i.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, 'Flag -i output mismatch');
          },
        },
        {
          name: 'grep: -v flag (invert match)',
          async run(ctx) {
            await ctx.writeTempFile('grep_v.txt', 'apple\nbanana\napricot\n');
            const grepPath = await findBinary(ctx, 's21_grep');
            const s21 = await ctx.exec(`${grepPath} -v "ap" .verter-tmp/grep_v.txt`);
            const sys = await ctx.exec(`grep -v "ap" .verter-tmp/grep_v.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, 'Flag -v output mismatch');
          },
        },
        {
          name: 'grep: -c flag (count matches)',
          async run(ctx) {
            await ctx.writeTempFile('grep_c.txt', 'apple\nbanana\napricot\ncherry\n');
            const grepPath = await findBinary(ctx, 's21_grep');
            const s21 = await ctx.exec(`${grepPath} -c "a" .verter-tmp/grep_c.txt`);
            const sys = await ctx.exec(`grep -c "a" .verter-tmp/grep_c.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, 'Flag -c output mismatch');
          },
        },
        {
          name: 'grep: -l flag (files with matches)',
          async run(ctx) {
            await ctx.writeTempFile('grep_l1.txt', 'apple\n');
            await ctx.writeTempFile('grep_l2.txt', 'banana\n');
            const grepPath = await findBinary(ctx, 's21_grep');
            const s21 = await ctx.exec(`${grepPath} -l "apple" .verter-tmp/grep_l1.txt .verter-tmp/grep_l2.txt`);
            const sys = await ctx.exec(`grep -l "apple" .verter-tmp/grep_l1.txt .verter-tmp/grep_l2.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, 'Flag -l output mismatch');
          },
        },
        {
          name: 'grep: -n flag (line numbers)',
          async run(ctx) {
            await ctx.writeTempFile('grep_n.txt', 'apple\nbanana\napricot\n');
            const grepPath = await findBinary(ctx, 's21_grep');
            const s21 = await ctx.exec(`${grepPath} -n "a" .verter-tmp/grep_n.txt`);
            const sys = await ctx.exec(`grep -n "a" .verter-tmp/grep_n.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, 'Flag -n output mismatch');
          },
        },
        {
          name: 'grep: -h flag (no filename)',
          async run(ctx) {
            await ctx.writeTempFile('grep_h1.txt', 'apple pie\n');
            await ctx.writeTempFile('grep_h2.txt', 'apple juice\n');
            const grepPath = await findBinary(ctx, 's21_grep');
            const s21 = await ctx.exec(`${grepPath} -h "apple" .verter-tmp/grep_h1.txt .verter-tmp/grep_h2.txt`);
            const sys = await ctx.exec(`grep -h "apple" .verter-tmp/grep_h1.txt .verter-tmp/grep_h2.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, 'Flag -h output mismatch');
          },
        },
        {
          name: 'grep: -s flag (suppress errors)',
          async run(ctx) {
            const grepPath = await findBinary(ctx, 's21_grep');
            const result = await ctx.exec(`${grepPath} -s "pattern" nonexistent_file.txt 2>&1`);
            ctx.assert(result.stderr === '', 'Flag -s should suppress error messages');
          },
        },
        {
          name: 'grep: -f flag (patterns from file)',
          async run(ctx) {
            await ctx.writeTempFile('patterns.txt', 'apple\nbanana\n');
            await ctx.writeTempFile('grep_f.txt', 'apple pie\ncherry\nbanana split\n');
            const grepPath = await findBinary(ctx, 's21_grep');
            const s21 = await ctx.exec(`${grepPath} -f .verter-tmp/patterns.txt .verter-tmp/grep_f.txt`);
            const sys = await ctx.exec(`grep -f .verter-tmp/patterns.txt .verter-tmp/grep_f.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, 'Flag -f output mismatch');
          },
        },
        {
          name: 'grep: -o flag (only matching)',
          async run(ctx) {
            await ctx.writeTempFile('grep_o.txt', 'apple pie and banana split\n');
            const grepPath = await findBinary(ctx, 's21_grep');
            const s21 = await ctx.exec(`${grepPath} -o "a[a-z]*" .verter-tmp/grep_o.txt`);
            const sys = await ctx.exec(`grep -o "a[a-z]*" .verter-tmp/grep_o.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, 'Flag -o output mismatch');
          },
        },
        {
          name: 'grep: multiple files',
          async run(ctx) {
            await ctx.writeTempFile('grep_multi1.txt', 'apple\n');
            await ctx.writeTempFile('grep_multi2.txt', 'apple\n');
            const grepPath = await findBinary(ctx, 's21_grep');
            const s21 = await ctx.exec(`${grepPath} "apple" .verter-tmp/grep_multi1.txt .verter-tmp/grep_multi2.txt`);
            const sys = await ctx.exec(`grep "apple" .verter-tmp/grep_multi1.txt .verter-tmp/grep_multi2.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, 'Multiple files output mismatch');
          },
        },
        {
          name: 'grep: stdin reading',
          async run(ctx) {
            const grepPath = await findBinary(ctx, 's21_grep');
            const input = 'apple pie\nbanana\n';
            const s21 = await ctx.exec(`echo "${input}" | ${grepPath} "apple"`);
            const sys = await ctx.exec(`echo "${input}" | grep "apple"`);
            ctx.assertEqual(s21.stdout, sys.stdout, 'Stdin output mismatch');
          },
        },
        {
          name: 'grep: combined -iv (invert and ignore case)',
          async run(ctx) {
            await ctx.writeTempFile('grep_iv.txt', 'Apple\nbanana\napricot\n');
            const grepPath = await findBinary(ctx, 's21_grep');
            const s21 = await ctx.exec(`${grepPath} -iv "apple" .verter-tmp/grep_iv.txt`);
            const sys = await ctx.exec(`grep -iv "apple" .verter-tmp/grep_iv.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, 'Combined -iv mismatch');
          },
        },
        {
          name: 'grep: combined -in (ignore case and line numbers)',
          async run(ctx) {
            await ctx.writeTempFile('grep_in.txt', 'Apple\nbanana\napple\n');
            const grepPath = await findBinary(ctx, 's21_grep');
            const s21 = await ctx.exec(`${grepPath} -in "apple" .verter-tmp/grep_in.txt`);
            const sys = await ctx.exec(`grep -in "apple" .verter-tmp/grep_in.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, 'Combined -in mismatch');
          },
        },
        {
          name: 'grep: combined -on (only matching and line numbers)',
          async run(ctx) {
            await ctx.writeTempFile('grep_on.txt', 'apple pie\nbanana\napple juice\n');
            const grepPath = await findBinary(ctx, 's21_grep');
            const s21 = await ctx.exec(`${grepPath} -on "apple" .verter-tmp/grep_on.txt`);
            const sys = await ctx.exec(`grep -on "apple" .verter-tmp/grep_on.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, 'Combined -on mismatch');
          },
        },
        {
          name: 'grep: combined -oh (only matching and no filename)',
          async run(ctx) {
            await ctx.writeTempFile('grep_oh1.txt', 'apple pie\n');
            await ctx.writeTempFile('grep_oh2.txt', 'apple juice\n');
            const grepPath = await findBinary(ctx, 's21_grep');
            const s21 = await ctx.exec(`${grepPath} -oh "apple" .verter-tmp/grep_oh1.txt .verter-tmp/grep_oh2.txt`);
            const sys = await ctx.exec(`grep -oh "apple" .verter-tmp/grep_oh1.txt .verter-tmp/grep_oh2.txt`);
            ctx.assertEqual(s21.stdout, sys.stdout, 'Combined -oh mismatch');
          },
        },
        {
          name: 'grep: no match returns empty',
          async run(ctx) {
            await ctx.writeTempFile('grep_empty.txt', 'apple\nbanana\n');
            const grepPath = await findBinary(ctx, 's21_grep');
            const s21 = await ctx.exec(`${grepPath} "zzzzz" .verter-tmp/grep_empty.txt`);
            ctx.assertEqual(s21.stdout.trim(), '', 'Should return empty for no match');
          },
        },
      ],
    },
  ],

  styleChecks: [
    {
      name: 'S21 C Style Norm',
      async check(projectDir) {
        const { STYLE_CHECKERS } = await import('../core/style-check.js');
        return STYLE_CHECKERS.c.check(projectDir);
      },
    },
  ],

  async teardown(projectDir) {
    // Cleanup after tests
  },
};

/**
 * Helper: find binary in common locations
 */
async function findBinary(ctx, name) {
  const paths = [
    `src/cat/${name}`, `src/grep/${name}`,
    `cat/${name}`, `grep/${name}`,
    name,
    `build/${name}`,
  ];

  for (const p of paths) {
    if (await ctx.fileExists(p)) return `./${p}`;
  }

  return `./${name}`;
}
