const express = require('express');
const Redis = require('ioredis');
const app = express();
const redis = new Redis('redis://localhost:6379');

app.use(express.json());

app.post('/zadd/:key', async (req, res) => {
  const { key } = req.params;
  const { score, member } = req.body;
  try {
    const result = await redis.zadd(key, score, member);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/zrangebyscore/:key/:min/:max', async (req, res) => {
  const { key, min, max } = req.params;
  try {
    const result = await redis.zrangebyscore(key, min, max);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/del/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const result = await redis.del(key);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/keys/:pattern', async (req, res) => {
  const { pattern } = req.params;
  try {
    const result = await redis.keys(pattern);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Redis REST server running on port ${PORT}`);
}); 