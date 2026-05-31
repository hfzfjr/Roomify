# Load variabel dari .env.local (lebih aman, support value dengan karakter spesial)
set -a
source .env.local
set +a

git pull origin main

# Build image, key di-pass sebagai build argument
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  -t roomify-app .

docker rm -f roomify-server
docker run -d -p 3000:3000 --name roomify-server --restart always roomify-app

echo "Deploy selesai!"