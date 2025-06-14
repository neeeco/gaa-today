import { useEffect, useState } from 'react';
import { supabase } from './_app';

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('example_table')
          .select('*')
          .limit(10);

        if (error) throw error;
        setData(data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">GAA Today</h1>
        
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid gap-4">
            {data.map((item) => (
              <div
                key={item.id}
                className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <pre>{JSON.stringify(item, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
} 