import { db, execute, queryAll, queryOne } from './models/db.js';
import { catalog } from './catalog/index.js';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

/** Explicit provisioning: re-running seed restores the requested default credentials. */
export async function seedDatabase() {
  db.exec('BEGIN IMMEDIATE');
  try {
    // Move existing catalog rows temporarily so Reverse (#12 -> #49) cannot collide.
    // IDs, submissions and progress are retained. Custom questions are never deleted.
    const slugs = new Set(catalog.map(p => p.slug));
    const rows = queryAll('SELECT id, slug, problem_number FROM problems');
    let nextNumber = Math.max(catalog.length, ...rows.map(p => Number(p.problem_number))) + 1;
    for (const row of rows) {
      if (slugs.has(row.slug) || row.problem_number <= catalog.length) {
        execute('UPDATE problems SET problem_number = ? WHERE id = ?', [nextNumber++, row.id]);
      }
    }
    for (const p of catalog) {
      const existing = queryOne('SELECT id FROM problems WHERE slug = ?', [p.slug]);
      const id = existing?.id || randomUUID();
      const fields = ['problem_number','title','slug','description','difficulty','category','constraints','input_format','output_format','reference_solution'];
      const values = fields.map(key => (p as any)[key]);
      if (existing) {
        execute(`UPDATE problems SET ${fields.map(k => `${k} = ?`).join(', ')}, starter_c='', starter_cpp='', starter_java='', starter_python='', reference_lang='python' WHERE id=?`, [...values, id]);
      } else {
        execute(`INSERT INTO problems (id, ${fields.join(',')}, starter_c, starter_cpp, starter_java, starter_python) VALUES (${Array(fields.length+5).fill('?').join(',')})`, [id,...values,'','','','']);
      }
      execute('DELETE FROM problem_examples WHERE problem_id=?',[id]);
      execute('DELETE FROM problem_tags WHERE problem_id=?',[id]);
      execute('DELETE FROM test_cases WHERE problem_id=?',[id]);
      p.examples.forEach((e,i) => execute('INSERT INTO problem_examples (id,problem_id,input,output,explanation,order_num) VALUES (?,?,?,?,?,?)',[randomUUID(),id,e.input,e.output,e.explanation,i+1]));
      p.tests.forEach((t,i) => execute('INSERT INTO test_cases (id,problem_id,input,expected_output,test_type,is_hidden,order_num) VALUES (?,?,?,?,?,?,?)',[randomUUID(),id,t.input,t.expected_output,t.test_type,t.is_hidden?1:0,i+1]));
      for (const slug of p.tags) {
        let tag = queryOne('SELECT id FROM tags WHERE slug=?',[slug]);
        if (!tag) {
          tag={id:randomUUID()};
          const name=slug.startsWith('level-')?slug.replace('level-','Level '):slug.split('-').map((w: string)=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
          execute('INSERT INTO tags (id,name,slug) VALUES (?,?,?)',[tag.id,name,slug]);
        }
        execute('INSERT INTO problem_tags (problem_id,tag_id) VALUES (?,?)',[id,tag.id]);
      }
    }
    // All editors now start empty, including admin-authored questions.
    execute("UPDATE problems SET starter_c='', starter_cpp='', starter_java='', starter_python=''");
    db.exec('COMMIT');
    console.log(`Seeded ${catalog.length} PDF problems and ${catalog.reduce((n,p)=>n+p.tests.length,0)} test cases.`);
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedDatabase().catch(error => { console.error(error); process.exitCode=1; });
}
