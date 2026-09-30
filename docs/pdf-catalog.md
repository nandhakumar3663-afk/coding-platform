# PDF question catalog

All 57 Level 2 questions and all 52 Level 3 questions are included. Original numbering is shown in each description. Platform numbers 1–57 are Level 2; 58–109 are Level 3. Existing problem IDs/slugs are preserved by seeding.

Each reference is checked against a hand-entered example. Deterministic hidden inputs cover edge cases and larger values. These are hidden from the student API, not secret from repository owners. Do not publish the backend catalog if test secrecy from source readers is required.

## Judging conventions

Read stdin without interactive prompts. Array outputs use spaces, not concatenated digits. Line breaks distinguish output sections and pattern rows. Trailing whitespace is ignored. C/C++ solutions should use 64-bit integers where constraints require them; Java solutions use Main. No language receives starter code.

## Source ambiguities and corrections

- **Level 2 Q7 — Count Leap and Non-Leap Years:** The next decade excludes the input year.
- **Level 2 Q13 — Pyramid Pattern:** Numbers are separated by spaces, including the first three rows.
- **Level 2 Q17 — Sum of Odd and Even Numbers up to N:** The samples sum numbers up to n, not the first n odd/even terms.
- **Level 2 Q22 — Finding Consecutive Palindromic Numbers:** Include n itself when palindromic, as in the PDF sample for 99.
- **Level 2 Q27 — Prime Pattern:** A space follows each asterisk in the source instruction; trailing spaces are optional.
- **Level 2 Q35 — Printing Pattern in Reverse Order:** Follow the sample: row values ascend; row lengths decrease.
- **Level 2 Q47 — XOR Operations — Collatz Steps:** The PDF describes Collatz steps. Its XOR-only restriction is inconsistent with the task; this judge checks the output, not which operators you use.
- **Level 2 Q57 — Palindrome Check:** Use "is a Palindrome" consistently; one PDF example omits "a".
- **Level 3 Q1 — Average of an Array:** The supplied answer fixes n=5 and uses integer division.
- **Level 3 Q3 — Peak Elements:** Endpoint-first ordering matches the answer code; equal neighbors qualify.
- **Level 3 Q11 — Removing Duplicate Elements — Keep Last:** Unlike question 28, this answer keeps the last occurrence.
- **Level 3 Q15 — Sum of Duplicate Elements:** For [2,2,2], print 2 2 then sum 4. This follows the supplied answer rather than summing each repeated value once.
- **Level 3 Q16 — Non-Prime Numbers:** The supplied code excludes 0,1 and negative values, so this exercise uses composite numbers.
- **Level 3 Q19 — Second Largest Number:** Fixes the source initialization bug when the first element is already the largest.
- **Level 3 Q22 — Removing First Occurrence:** Fixes the source code dropping the last element when x is absent.
- **Level 3 Q23 — Pair with Sum Closest to Zero:** The 2..10 restriction is applied to length. Applying it to values would contradict the PDF example with -10 and -1.
- **Level 3 Q24 — Median:** Fractional medians are preserved; the source accidentally uses integer division.
- **Level 3 Q33 — Even-Odd Partition and Sorted Array:** The PDF labels this question only "33."; its two answer screenshots define this operation.
- **Level 3 Q34 — Find a Pair with a Given Sum:** The screenshot prints indices rather than values.
- **Level 3 Q36 — Sum of Neighbor Peak Elements:** The source reads outside array bounds and modifies values while detecting peaks. This contract uses existing neighbors and simultaneous updates to make results deterministic.
- **Level 3 Q40 — Remove All Occurrences of a Value:** This removes whole elements, not digits within multi-digit integers.
- **Level 3 Q43 — Ranking:** Uses competition ranking, not dense ranking: [10,10,20] gives [1,1,3].
- **Level 3 Q44 — Remove Even Numbers at Even Indices:** The source starts at index 2 and shifts indices during deletion. This corrected contract uses original zero-based indices consistently.
- **Level 3 Q45 — Remove Elements Greater Than a Number:** Follows the question heading; the screenshot uses < and accidentally also removes equal values.
- **Level 3 Q48 — Maximum Subarray Sum:** The source code repeats arr[i] instead of summing a subarray and shows 42 for [7,8,9,6,5,4]. This corrected maximum-subarray problem gives 39 for that array.
- **Level 3 Q50 — Left Character Rotation:** The PDF supplies only a heading for this question; this input/output contract completes it.

## Complete mapping

| PDF | Question | Platform # | Title | Hidden cases |
|---|---:|---:|---|---:|
| Level 2 | 1 | 1 | Fibonacci Series | 7 |
| Level 2 | 2 | 2 | Smallest 5 Primes Greater Than N | 6 |
| Level 2 | 3 | 3 | Prime or Composite Number | 7 |
| Level 2 | 4 | 4 | Series Sum Calculator | 6 |
| Level 2 | 5 | 5 | Divisor Sum and Equality Checker | 6 |
| Level 2 | 6 | 6 | Abundant Number | 6 |
| Level 2 | 7 | 7 | Count Leap and Non-Leap Years | 7 |
| Level 2 | 8 | 8 | Geometric Series Sum Calculator | 7 |
| Level 2 | 9 | 9 | Sum of Squares of N Natural Numbers | 6 |
| Level 2 | 10 | 10 | Harmonic Series Sum | 6 |
| Level 2 | 11 | 11 | Digits Count | 6 |
| Level 2 | 12 | 12 | Square Pattern | 6 |
| Level 2 | 13 | 13 | Pyramid Pattern | 6 |
| Level 2 | 14 | 14 | Swap the Digits | 6 |
| Level 2 | 15 | 15 | Perfect Cubes | 6 |
| Level 2 | 16 | 16 | Roman Numerals | 7 |
| Level 2 | 17 | 17 | Sum of Odd and Even Numbers up to N | 6 |
| Level 2 | 18 | 18 | Detecting Narcissistic Numbers | 6 |
| Level 2 | 19 | 19 | Digit Sum Calculator | 6 |
| Level 2 | 20 | 20 | Alphabet Triangle Generator | 6 |
| Level 2 | 21 | 21 | Finding the Next Palindrome | 6 |
| Level 2 | 22 | 22 | Finding Consecutive Palindromic Numbers | 6 |
| Level 2 | 23 | 23 | Palindromic Right-Angled Triangle | 6 |
| Level 2 | 24 | 24 | The Palindromic Sum | 6 |
| Level 2 | 25 | 25 | Pattern Printing with Multiples of 5 | 6 |
| Level 2 | 26 | 26 | Squares of Even and Odd Numbers | 6 |
| Level 2 | 27 | 27 | Prime Pattern | 6 |
| Level 2 | 28 | 28 | LCM Finder | 7 |
| Level 2 | 29 | 29 | The Perfect Number Detective | 6 |
| Level 2 | 30 | 30 | Handshake Simulation Program | 6 |
| Level 2 | 31 | 31 | Odd or Even Numbers Series | 6 |
| Level 2 | 32 | 32 | Digit Summation | 6 |
| Level 2 | 33 | 33 | Vowel Counter | 6 |
| Level 2 | 34 | 34 | Digit Incrementer | 6 |
| Level 2 | 35 | 35 | Printing Pattern in Reverse Order | 6 |
| Level 2 | 36 | 36 | The Odd Factorial Quest | 6 |
| Level 2 | 37 | 37 | Series Expansion | 6 |
| Level 2 | 38 | 38 | Fibonacci Even Number Generator | 7 |
| Level 2 | 39 | 39 | Exploring the Growth Series | 6 |
| Level 2 | 40 | 40 | Sum of All Prime Factors | 6 |
| Level 2 | 41 | 41 | Sum of N Odd Natural Numbers | 6 |
| Level 2 | 42 | 42 | Check Second Even Number | 7 |
| Level 2 | 43 | 43 | Floyd's Triangle | 6 |
| Level 2 | 44 | 44 | Automorphic Number | 7 |
| Level 2 | 45 | 45 | Sum of First and Last Digit | 6 |
| Level 2 | 46 | 46 | Sum of Even Numbers | 6 |
| Level 2 | 47 | 47 | XOR Operations — Collatz Steps | 6 |
| Level 2 | 48 | 48 | Sum of the Middle Digits | 6 |
| Level 2 | 49 | 49 | Reverse the Digits | 6 |
| Level 2 | 50 | 50 | Perfect Square | 6 |
| Level 2 | 51 | 51 | Alphabetical Pattern | 6 |
| Level 2 | 52 | 52 | Multiples of 5 — Pattern Printing | 6 |
| Level 2 | 53 | 53 | Product of N Digits | 6 |
| Level 2 | 54 | 54 | Prime Numbers in a Range | 6 |
| Level 2 | 55 | 55 | Harshad Number | 6 |
| Level 2 | 56 | 56 | Strong Number | 6 |
| Level 2 | 57 | 57 | Palindrome Check | 6 |
| Level 3 | 1 | 58 | Average of an Array | 6 |
| Level 3 | 2 | 59 | Finding the Maximum Number | 6 |
| Level 3 | 3 | 60 | Peak Elements | 6 |
| Level 3 | 4 | 61 | Left Rotation | 6 |
| Level 3 | 5 | 62 | Right Rotation | 6 |
| Level 3 | 6 | 63 | Number of Occurrences | 6 |
| Level 3 | 7 | 64 | Sum and Product of an Array | 6 |
| Level 3 | 8 | 65 | Square of Array Elements | 6 |
| Level 3 | 9 | 66 | Difference Between Maximum and Minimum | 6 |
| Level 3 | 10 | 67 | Elements Divisible by a Number | 6 |
| Level 3 | 11 | 68 | Removing Duplicate Elements — Keep Last | 6 |
| Level 3 | 12 | 69 | Negative Elements | 6 |
| Level 3 | 13 | 70 | Positive Elements | 6 |
| Level 3 | 14 | 71 | Delete an Element at a Position | 6 |
| Level 3 | 15 | 72 | Sum of Duplicate Elements | 6 |
| Level 3 | 16 | 73 | Non-Prime Numbers | 6 |
| Level 3 | 17 | 74 | Sum of First, Second, Last and Penultimate | 6 |
| Level 3 | 18 | 75 | Printing Unique Numbers | 6 |
| Level 3 | 19 | 76 | Second Largest Number | 6 |
| Level 3 | 20 | 77 | Ascending Order | 6 |
| Level 3 | 21 | 78 | Removing Even Numbers | 6 |
| Level 3 | 22 | 79 | Removing First Occurrence | 6 |
| Level 3 | 23 | 80 | Pair with Sum Closest to Zero | 7 |
| Level 3 | 24 | 81 | Median | 6 |
| Level 3 | 25 | 82 | Chunk Size | 7 |
| Level 3 | 26 | 83 | Insert at a Particular Position | 6 |
| Level 3 | 27 | 84 | Frequency of Elements | 6 |
| Level 3 | 28 | 85 | Deleting Duplicates — Keep First | 6 |
| Level 3 | 29 | 86 | Merge Two Arrays and Sort | 6 |
| Level 3 | 30 | 87 | Reverse Array Elements | 6 |
| Level 3 | 31 | 88 | Even and Odd Numbers in Separate Arrays | 6 |
| Level 3 | 32 | 89 | Search an Element and Print Its Position | 6 |
| Level 3 | 33 | 90 | Even-Odd Partition and Sorted Array | 6 |
| Level 3 | 34 | 91 | Find a Pair with a Given Sum | 6 |
| Level 3 | 35 | 92 | Removing First Occurrence — Practice | 6 |
| Level 3 | 36 | 93 | Sum of Neighbor Peak Elements | 6 |
| Level 3 | 37 | 94 | Swapping Two Elements | 6 |
| Level 3 | 38 | 95 | Sorted or Not Sorted | 6 |
| Level 3 | 39 | 96 | Sort Even Numbers First, Odd Numbers Next | 6 |
| Level 3 | 40 | 97 | Remove All Occurrences of a Value | 6 |
| Level 3 | 41 | 98 | Product of Array Except Self | 7 |
| Level 3 | 42 | 99 | Numbers Smaller Than the Current Number | 6 |
| Level 3 | 43 | 100 | Ranking | 6 |
| Level 3 | 44 | 101 | Remove Even Numbers at Even Indices | 6 |
| Level 3 | 45 | 102 | Remove Elements Greater Than a Number | 6 |
| Level 3 | 46 | 103 | Last Repeated Element | 6 |
| Level 3 | 47 | 104 | Array Leaders in Ascending Order | 6 |
| Level 3 | 48 | 105 | Maximum Subarray Sum | 6 |
| Level 3 | 49 | 106 | Sum of Non-Repeated Numbers | 6 |
| Level 3 | 50 | 107 | Left Character Rotation | 6 |
| Level 3 | 51 | 108 | Indices of All Pairs with Target Sum | 6 |
| Level 3 | 52 | 109 | Converting Angle to Radians | 7 |
