import { db, execute, queryAll, queryOne } from './models/db.js';
import { generateAndStoreTestCases } from './test-generator/testCaseGenerator.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function seedDatabase() {
  console.log('--- Starting Database Seeding ---');

  // 1. Seed Default Users (Admin & Student)
  const studentPw = await bcrypt.hash('student123', 10);
  const adminPw = await bcrypt.hash('admin123', 4);

  const existingStudent = queryOne('SELECT id FROM users WHERE username = ?', ['student']);
  if (!existingStudent) {
    execute(
      `INSERT INTO users (id, username, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), 'student', 'student@platform.edu', studentPw, 'student']
    );
    console.log('Created demo student user: student / student123');
  }

  const existingAdmin = queryOne('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!existingAdmin) {
    execute(
      `INSERT INTO users (id, username, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), 'admin', 'admin@platform.edu', adminPw, 'admin']
    );
    console.log('Created admin user: admin / admin123');
  }

  // 2. Seed Tags
  const tagList = [
    { name: 'Array', slug: 'array' },
    { name: 'String', slug: 'string' },
    { name: 'Math', slug: 'math' },
    { name: 'Number Theory', slug: 'number-theory' },
    { name: 'Loops', slug: 'loops' },
    { name: 'Conditionals', slug: 'conditionals' },
    { name: 'Recursion', slug: 'recursion' },
    { name: 'Dynamic Programming', slug: 'dynamic-programming' },
    { name: 'Floating Point', slug: 'floating-point' },
    { name: 'Sorting', slug: 'sorting' },
  ];

  for (const t of tagList) {
    const existing = queryOne('SELECT id FROM tags WHERE slug = ?', [t.slug]);
    if (!existing) {
      execute('INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)', [uuidv4(), t.name, t.slug]);
    }
  }

  // 3. Problem definitions
  const problems = [
    {
      problem_number: 1,
      title: 'Fibonacci Series',
      slug: 'fibonacci-series',
      difficulty: 'Easy',
      category: 'Recursion & Math',
      tags: ['math', 'recursion', 'loops'],
      description: `Write a program that prompts the user to enter a positive integer **n**.
Your program should then generate and display the first **n** numbers of the Fibonacci series.
For example, if the user enters \`5\`, the program should output: \`0,1,1,2,3,\`.
If **n** is not a positive number (i.e. **n** <= 0), then print \`Invalid Input\`.`,
      constraints: `-100 <= n <= 45`,
      input_format: `A single integer n.`,
      output_format: `The first n numbers of the Fibonacci series separated by commas with a trailing comma, or 'Invalid Input'.`,
      examples: [
        { input: '5', output: '0,1,1,2,3,', explanation: 'First 5 Fibonacci numbers starting from 0, 1' },
        { input: '-5', output: 'Invalid Input', explanation: 'Negative numbers are not valid positive integers' },
      ],
      starter_c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int n = scanner.nextInt();
        // Write your code here
        
    }
}`,
      starter_python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    # Write your code here
    pass

if __name__ == '__main__':
    main()`,
      reference_solution: `import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    try:
        n = int(raw)
    except:
        return
    if n <= 0:
        print("Invalid Input")
        return
    a, b = 0, 1
    res = []
    for _ in range(n):
        res.append(str(a))
        a, b = b, a + b
    print(','.join(res) + ',')

solve()`,
    },
    {
      problem_number: 2,
      title: 'Smallest 5 Primes Greater Than N',
      slug: 'smallest-prime-number',
      difficulty: 'Easy',
      category: 'Number Theory',
      tags: ['math', 'number-theory', 'loops'],
      description: `Craft a program that prompts a user to input an integer **n**, finds the smallest **5 prime numbers strictly greater than n**, and prints each prime number on a new line.`,
      constraints: `1 <= n <= 10000`,
      input_format: `A single integer n.`,
      output_format: `5 prime numbers strictly greater than n, each printed on a separate line.`,
      examples: [
        { input: '10', output: '11\\n13\\n17\\n19\\n23', explanation: 'The 5 smallest prime numbers greater than 10 are 11, 13, 17, 19, 23' },
        { input: '20', output: '23\\n29\\n31\\n37\\n41', explanation: 'The 5 smallest prime numbers greater than 20 are 23, 29, 31, 37, 41' },
      ],
      starter_c: `#include <stdio.h>
#include <stdbool.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_cpp: `#include <iostream>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int n = scanner.nextInt();
        // Write your code here
        
    }
}`,
      starter_python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines: return
    n = int(lines[0])
    # Write your code here
    pass

if __name__ == '__main__':
    main()`,
      reference_solution: `import sys

def is_prime(x):
    if x < 2: return False
    for i in range(2, int(x**0.5) + 1):
        if x % i == 0: return False
    return True

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    n = int(raw)
    count = 0
    cur = n + 1
    while count < 5:
        if is_prime(cur):
            print(cur)
            count += 1
        cur += 1

solve()`,
    },
    {
      problem_number: 3,
      title: 'Prime or Composite Number',
      slug: 'prime-or-composite-number',
      difficulty: 'Easy',
      category: 'Number Theory',
      tags: ['math', 'number-theory'],
      description: `Craft a program that prompts the user to input a positive integer. The program should determine whether the entered number is a **prime** or **composite** number.
Output format:
- If prime: \`<n> is a prime number\`
- If composite: \`<n> is a composite number\``,
      constraints: `2 <= n <= 100000`,
      input_format: `A single integer n.`,
      output_format: `'<n> is a prime number' or '<n> is a composite number'.`,
      examples: [
        { input: '7', output: '7 is a prime number', explanation: '7 has only 1 and 7 as divisors' },
        { input: '12', output: '12 is a composite number', explanation: '12 is divisible by 2, 3, 4, 6' },
      ],
      starter_c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_cpp: `#include <iostream>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int n = scanner.nextInt();
        // Write your code here
        
    }
}`,
      starter_python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines: return
    n = int(lines[0])
    # Write your code here
    pass

if __name__ == '__main__':
    main()`,
      reference_solution: `import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    n = int(raw)
    if n < 2:
        print(f"{n} is neither prime nor composite")
        return
    is_prime = True
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            is_prime = False
            break
    if is_prime:
        print(f"{n} is a prime number")
    else:
        print(f"{n} is a composite number")

solve()`,
    },
    {
      problem_number: 4,
      title: 'Series Sum Calculator',
      slug: 'series-sum-calculator',
      difficulty: 'Medium',
      category: 'Math & Loops',
      tags: ['math', 'loops', 'string'],
      description: `Craft a program that prompts the user to input the digit term **x** and the number of terms **n** in the series.
The series consists of repeating the digit x from 1 to n times: \`x + xx + xxx + ... + x(n times)\`.
The program then calculates the sum of the series and displays it along with the series itself.
Output:
- Line 1: The series terms joined by \` + \`
- Line 2: The sum of the series`,
      constraints: `1 <= x <= 9, 1 <= n <= 10`,
      input_format: `Two lines: digit x on line 1, count of terms n on line 2.`,
      output_format: `Line 1: Series string. Line 2: Sum.`,
      examples: [
        { input: '3\\n4', output: '3 + 33 + 333 + 3333\\n3702', explanation: 'Four terms of 3s sum to 3702' },
        { input: '5\\n3', output: '5 + 55 + 555\\n615', explanation: 'Three terms of 5s sum to 615' },
      ],
      starter_c: `#include <stdio.h>

int main() {
    int x, n;
    if (scanf("%d %d", &x, &n) != 2) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_cpp: `#include <iostream>
using namespace std;

int main() {
    int x, n;
    if (!(cin >> x >> n)) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int x = scanner.nextInt();
        int n = scanner.nextInt();
        // Write your code here
        
    }
}`,
      starter_python: `import sys

def main():
    tokens = sys.stdin.read().split()
    if len(tokens) < 2: return
    x = int(tokens[0])
    n = int(tokens[1])
    # Write your code here
    pass

if __name__ == '__main__':
    main()`,
      reference_solution: `import sys

def solve():
    tokens = sys.stdin.read().split()
    if len(tokens) < 2: return
    x = int(tokens[0])
    n = int(tokens[1])
    terms = []
    total = 0
    cur = 0
    for _ in range(n):
        cur = cur * 10 + x
        terms.append(str(cur))
        total += cur
    print(" + ".join(terms))
    print(total)

solve()`,
    },
    {
      problem_number: 5,
      title: 'Divisor Sum and Equality Checker',
      slug: 'divisor-sum-and-equality-checker',
      difficulty: 'Medium',
      category: 'Number Theory',
      tags: ['math', 'number-theory'],
      description: `Craft a program to prompt the user to input a number.
Find and display the positive proper divisors (excluding the number itself) separated by spaces.
On the next line, display the sum of the divisors.
Finally, check if the sum equals the original number:
- If equal: \`<n> is an equal number\`
- If not equal: \`<n> is not an equal number\``,
      constraints: `1 <= n <= 10000`,
      input_format: `A single integer n.`,
      output_format: `Line 1: space-separated divisors. Line 2: sum. Line 3: equality verdict.`,
      examples: [
        { input: '6', output: '1 2 3\\n6\\n6 is an equal number', explanation: 'Proper divisors of 6 are 1, 2, 3; sum = 6' },
        { input: '42', output: '1 2 3 6 7 14 21\\n54\\n42 is not an equal number', explanation: 'Sum of proper divisors of 42 is 54 != 42' },
      ],
      starter_c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_cpp: `#include <iostream>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int n = scanner.nextInt();
        // Write your code here
        
    }
}`,
      starter_python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines: return
    n = int(lines[0])
    # Write your code here
    pass

if __name__ == '__main__':
    main()`,
      reference_solution: `import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    n = int(raw)
    divs = []
    for i in range(1, n):
        if n % i == 0:
            divs.append(i)
    div_sum = sum(divs)
    print(" ".join(map(str, divs)))
    print(div_sum)
    if div_sum == n:
        print(f"{n} is an equal number")
    else:
        print(f"{n} is not an equal number")

solve()`,
    },
    {
      problem_number: 6,
      title: 'Abundant Number',
      slug: 'abundant-number',
      difficulty: 'Easy',
      category: 'Number Theory',
      tags: ['math', 'number-theory'],
      description: `An abundant number is a positive integer for which the sum of its proper divisors (excluding itself) is strictly greater than the number itself.
Determine whether a given integer is an abundant number.
Output format:
- \`<n> is an Abundant number\`
- \`<n> is not an Abundant number\``,
      constraints: `1 <= n <= 10000`,
      input_format: `A single integer n.`,
      output_format: `'<n> is an Abundant number' or '<n> is not an Abundant number'.`,
      examples: [
        { input: '12', output: '12 is an Abundant number', explanation: 'Proper divisors: 1+2+3+4+6 = 16 > 12' },
        { input: '7', output: '7 is not an Abundant number', explanation: 'Proper divisor: 1 < 7' },
      ],
      starter_c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_cpp: `#include <iostream>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int n = scanner.nextInt();
        // Write your code here
        
    }
}`,
      starter_python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines: return
    n = int(lines[0])
    # Write your code here
    pass

if __name__ == '__main__':
    main()`,
      reference_solution: `import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    n = int(raw)
    divs = [i for i in range(1, n) if n % i == 0]
    if sum(divs) > n:
        print(f"{n} is an Abundant number")
    else:
        print(f"{n} is not an Abundant number")

solve()`,
    },
    {
      problem_number: 7,
      title: 'Count Leap and Non-Leap Years in Decade',
      slug: 'leap-and-non-leap-years',
      difficulty: 'Medium',
      category: 'Conditionals & Logic',
      tags: ['math', 'conditionals', 'loops'],
      description: `Take a user-inputted year, determine if it was a leap year, and then count the number of leap and non-leap years in the next decade (the upcoming 10 years: Y+1 through Y+10).
Output format:
- Line 1: \`<year> is a Leap Year.\` or \`<year> is not a Leap Year.\`
- Line 2: \`Leap Years: <count>\`
- Line 3: \`Non-Leap Years: <count>\``,
      constraints: `1500 <= year <= 3000`,
      input_format: `A single integer representing the year.`,
      output_format: `Line 1: Leap status of given year. Line 2: Leap years count. Line 3: Non-leap years count.`,
      examples: [
        { input: '2022', output: '2022 is not a Leap Year.\\nLeap Years: 3\\nNon-Leap Years: 7', explanation: '2022 is not leap. In 2023-2032, 2024, 2028, 2032 are leap (3 years).' },
        { input: '2020', output: '2020 is a Leap Year.\\nLeap Years: 2\\nNon-Leap Years: 8', explanation: '2020 is leap. In 2021-2030, 2024 and 2028 are leap (2 years).' },
      ],
      starter_c: `#include <stdio.h>
#include <stdbool.h>

int main() {
    int year;
    if (scanf("%d", &year) != 1) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_cpp: `#include <iostream>
using namespace std;

int main() {
    int year;
    if (!(cin >> year)) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int year = scanner.nextInt();
        // Write your code here
        
    }
}`,
      starter_python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines: return
    year = int(lines[0])
    # Write your code here
    pass

if __name__ == '__main__':
    main()`,
      reference_solution: `import sys

def is_leap(y):
    return (y % 4 == 0 and y % 100 != 0) or (y % 400 == 0)

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    y = int(raw)
    if is_leap(y):
        print(f"{y} is a Leap Year.")
    else:
        print(f"{y} is not a Leap Year.")
    leaps = 0
    non_leaps = 0
    for year in range(y + 1, y + 11):
        if is_leap(year):
            leaps += 1
        else:
            non_leaps += 1
    print(f"Leap Years: {leaps}")
    print(f"Non-Leap Years: {non_leaps}")

solve()`,
    },
    {
      problem_number: 8,
      title: 'Geometric Series Sum Calculator',
      slug: 'geometric-series-sum-calculator',
      difficulty: 'Easy',
      category: 'Math & Series',
      tags: ['math', 'floating-point', 'loops'],
      description: `Calculate the sum of the first N terms of the geometric series:
\`1 + 1/2 + 1/4 + 1/8 + ...\` where each term is obtained by dividing the previous term by 2.
Output the sum of the first N terms with 2 digit precision (e.g. \`1.75\`).
For negative or zero input (N <= 0), print \`0.00\`.`,
      constraints: `-100 <= N <= 30`,
      input_format: `A single integer N.`,
      output_format: `The sum formatted to 2 decimal places.`,
      examples: [
        { input: '6', output: '1.97', explanation: '1 + 0.5 + 0.25 + 0.125 + 0.0625 + 0.03125 = 1.96875 -> 1.97' },
        { input: '-3', output: '0.00', explanation: 'Negative input outputs 0.00' },
      ],
      starter_c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_cpp: `#include <iostream>
#include <iomanip>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int n = scanner.nextInt();
        // Write your code here
        
    }
}`,
      starter_python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines: return
    n = int(lines[0])
    # Write your code here
    pass

if __name__ == '__main__':
    main()`,
      reference_solution: `import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    n = int(raw)
    if n <= 0:
        print("0.00")
        return
    total = 0.0
    term = 1.0
    for _ in range(n):
        total += term
        term /= 2.0
    print(f"{total:.2f}")

solve()`,
    },
    {
      problem_number: 9,
      title: 'Sum of Squares of N Natural Numbers',
      slug: 'sum-of-squares-of-n-natural-numbers',
      difficulty: 'Easy',
      category: 'Math & Loops',
      tags: ['math', 'loops'],
      description: `Given an integer **n**, calculate the sum of the squares of the first **n** natural numbers:
\`1^2 + 2^2 + 3^2 + ... + n^2\`.
If n <= 0, print \`0\`.`,
      constraints: `0 <= n <= 1000`,
      input_format: `A single integer n.`,
      output_format: `A single integer representing the sum of squares.`,
      examples: [
        { input: '5', output: '55', explanation: '1 + 4 + 9 + 16 + 25 = 55' },
        { input: '10', output: '385', explanation: 'Sum of squares up to 10 is 385' },
      ],
      starter_c: `#include <stdio.h>

int main() {
    long long n;
    if (scanf("%lld", &n) != 1) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_cpp: `#include <iostream>
using namespace std;

int main() {
    long long n;
    if (!(cin >> n)) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextLong()) return;
        long n = scanner.nextLong();
        // Write your code here
        
    }
}`,
      starter_python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines: return
    n = int(lines[0])
    # Write your code here
    pass

if __name__ == '__main__':
    main()`,
      reference_solution: `import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    n = int(raw)
    if n <= 0:
        print(0)
        return
    total = (n * (n + 1) * (2 * n + 1)) // 6
    print(total)

solve()`,
    },
    {
      problem_number: 10,
      title: 'Harmonic Series Sum',
      slug: 'harmonic-series',
      difficulty: 'Easy',
      category: 'Math & Series',
      tags: ['math', 'floating-point'],
      description: `Write a program to display the n terms of harmonic series and their sum:
\`1 + 1/2 + 1/3 + 1/4 + 1/5 ... 1/n\`.
Output the sum formatted with 2 decimal places.
If n <= 0, print \`Invalid input\`.`,
      constraints: `-50 <= n <= 1000`,
      input_format: `A single integer n.`,
      output_format: `The harmonic sum to 2 decimal places, or 'Invalid input'.`,
      examples: [
        { input: '5', output: '2.28', explanation: '1 + 1/2 + 1/3 + 1/4 + 1/5 = 2.2833 -> 2.28' },
        { input: '-1', output: 'Invalid input', explanation: 'Non-positive input results in Invalid input' },
      ],
      starter_c: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_cpp: `#include <iostream>
#include <iomanip>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int n = scanner.nextInt();
        // Write your code here
        
    }
}`,
      starter_python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines: return
    n = int(lines[0])
    # Write your code here
    pass

if __name__ == '__main__':
    main()`,
      reference_solution: `import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    n = int(raw)
    if n <= 0:
        print("Invalid input")
        return
    total = sum(1.0 / i for i in range(1, n + 1))
    print(f"{total:.2f}")

solve()`,
    },
    {
      problem_number: 11,
      title: 'Digits Count',
      slug: 'digits-count',
      difficulty: 'Easy',
      category: 'Math & Strings',
      tags: ['math', 'string', 'loops'],
      description: `Given an integer **n**, count and display the total number of digits. If n is negative, ignore the negative sign.`,
      constraints: `-10^18 <= n <= 10^18`,
      input_format: `A single integer n.`,
      output_format: `A single integer representing the count of digits.`,
      examples: [
        { input: '1234', output: '4', explanation: '1234 has 4 digits' },
        { input: '798456', output: '6', explanation: '798456 has 6 digits' },
      ],
      starter_c: `#include <stdio.h>

int main() {
    char s[100];
    if (scanf("%s", s) != 1) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    if (!(cin >> s)) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNext()) return;
        String s = scanner.next();
        // Write your code here
        
    }
}`,
      starter_python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines: return
    s = lines[0]
    # Write your code here
    pass

if __name__ == '__main__':
    main()`,
      reference_solution: `import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    s = raw.lstrip('-').strip()
    print(len(s))

solve()`,
    },
    {
      problem_number: 12,
      title: 'Reverse the Digits',
      slug: 'reverse-the-digits',
      difficulty: 'Easy',
      category: 'Math & Strings',
      tags: ['math', 'string', 'loops'],
      description: `Given an integer **n**, reverse its digits. If **n** has trailing zeros (e.g. 5020 or 100000), print the reversed integer without unnecessary leading zeros (e.g. \`205\` or \`1\`). Preserve negative signs if negative.`,
      constraints: `-10^9 <= n <= 10^9`,
      input_format: `A single integer n.`,
      output_format: `The reversed integer.`,
      examples: [
        { input: '1234', output: '4321', explanation: 'Digits reversed: 4321' },
        { input: '5020', output: '205', explanation: 'Reversed without leading zeros: 205' },
      ],
      starter_c: `#include <stdio.h>

int main() {
    long long n;
    if (scanf("%lld", &n) != 1) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_cpp: `#include <iostream>
using namespace std;

int main() {
    long long n;
    if (!(cin >> n)) return 0;
    // Write your code here
    
    return 0;
}`,
      starter_java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextLong()) return;
        long n = scanner.nextLong();
        // Write your code here
        
    }
}`,
      starter_python: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines: return
    n = int(lines[0])
    # Write your code here
    pass

if __name__ == '__main__':
    main()`,
      reference_solution: `import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw: return
    n = int(raw)
    sign = -1 if n < 0 else 1
    rev = int(str(abs(n))[::-1]) * sign
    print(rev)

solve()`,
    },
  ];

  // 4. Insert / Update Problems & Run Test Case Generation
  for (const p of problems) {
    let problemId = uuidv4();
    const existing = queryOne('SELECT id FROM problems WHERE slug = ?', [p.slug]);
    if (existing) {
      problemId = existing.id;
      execute(
        `UPDATE problems SET
          problem_number = ?, title = ?, description = ?, difficulty = ?, category = ?,
          constraints = ?, input_format = ?, output_format = ?,
          starter_c = ?, starter_cpp = ?, starter_java = ?, starter_python = ?,
          reference_solution = ?
         WHERE id = ?`,
        [
          p.problem_number, p.title, p.description, p.difficulty, p.category,
          p.constraints, p.input_format, p.output_format,
          p.starter_c, p.starter_cpp, p.starter_java, p.starter_python,
          p.reference_solution, problemId,
        ]
      );
      console.log(`Updated problem #${p.problem_number}: ${p.title}`);
    } else {
      execute(
        `INSERT INTO problems (
          id, problem_number, title, slug, description, difficulty, category,
          constraints, input_format, output_format,
          starter_c, starter_cpp, starter_java, starter_python,
          reference_solution, reference_lang
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'python')`,
        [
          problemId, p.problem_number, p.title, p.slug, p.description, p.difficulty, p.category,
          p.constraints, p.input_format, p.output_format,
          p.starter_c, p.starter_cpp, p.starter_java, p.starter_python,
          p.reference_solution,
        ]
      );
      console.log(`Created problem #${p.problem_number}: ${p.title}`);
    }

    // Insert examples
    execute('DELETE FROM problem_examples WHERE problem_id = ?', [problemId]);
    for (let i = 0; i < p.examples.length; i++) {
      const ex = p.examples[i];
      execute(
        `INSERT INTO problem_examples (id, problem_id, input, output, explanation, order_num)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), problemId, ex.input, ex.output, ex.explanation, i + 1]
      );
    }

    // Link tags
    execute('DELETE FROM problem_tags WHERE problem_id = ?', [problemId]);
    for (const tagSlug of p.tags) {
      const tagRow = queryOne('SELECT id FROM tags WHERE slug = ?', [tagSlug]);
      if (tagRow) {
        execute(
          'INSERT OR IGNORE INTO problem_tags (problem_id, tag_id) VALUES (?, ?)',
          [problemId, tagRow.id]
        );
      }
    }

    // Automatically generate and verify 5 test cases using the trusted reference solution
    console.log(`-> Generating 5 test cases for [${p.title}] using trusted reference solution...`);
    const genResult = await generateAndStoreTestCases(
      problemId,
      p.slug,
      p.reference_solution,
      'python',
      p.constraints,
      p.examples.map(e => e.input)
    );

    if (genResult.success) {
      console.log(`   ✓ ${genResult.message}`);
    } else {
      console.warn(`   ✗ Warning: ${genResult.message}`);
    }
  }

  console.log('--- Database Seeding Completed Successfully! ---');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
