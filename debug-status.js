// Debug script temporaire
const { exec } = require('child_process');

async function testAPI() {
  return new Promise((resolve, reject) => {
    exec('curl -sS "http://localhost:3000/api/admin/recent-news?limit=10"', (error, stdout, stderr) => {
      if (error) {
        console.error('Erreur:', error);
        return;
      }
      
      try {
        const data = JSON.parse(stdout);
        console.log('=== Status de chaque article ===');
        data.items.forEach(item => {
          console.log(`ID ${item.id}: "${item.title.substring(0,40)}..." → status: "${item.status}" (type: ${typeof item.status})`);
        });
      } catch (err) {
        console.error('Erreur parse JSON:', err.message);
        console.log('Raw output:', stdout);
      }
    });
  });
}

testAPI();
