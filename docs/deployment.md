# 部署指南

## 1. 准备

- 一台 Linux 服务器(CentOS / Ubuntu 均可)
- Node.js 20+
- MongoDB 7.x(本地或 Atlas)
- Nginx(可选,反代 + HTTPS)

## 2. 部署 MongoDB

### 方式 A:MongoDB Atlas(推荐)

1. 注册 [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. 创建一个免费 M0 集群
3. 在 Database Access 添加用户
4. 在 Network Access 允许你的服务器 IP
5. 拿到连接串,类似:
   ```
   mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/edu_coding
   ```

### 方式 B:自建

```bash
docker run -d --name mongo \
  -p 27017:27017 \
  -v /data/mongo:/data/db \
  --restart unless-stopped \
  mongo:7
```

国内服务器加速 Docker 镜像拉取:

```bash
# 配置 Docker 镜像加速器
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

## 3. 部署后端

```bash
# 拉代码
git clone <repo> /opt/edu-coding-platform
cd /opt/edu-coding-platform/backend

# 装依赖
npm ci --production

# 写 .env
cat > .env <<EOF
PORT=4000
MONGODB_URI=mongodb://...
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d
TEACHER_INVITE_CODES=DEMO2026,TEACH2026
CORS_ORIGIN=https://yourdomain.com
EOF

# 编译
npm run build

# 用 pm2 跑
npm i -g pm2
pm2 start dist/server.js --name edu-backend
pm2 save
pm2 startup
```

灌入示例数据:
```bash
cd /opt/edu-coding-platform/backend
npm run seed:demo
```

## 4. 部署前端

```bash
cd /opt/edu-coding-platform/frontend

# 写 .env
cat > .env <<EOF
VITE_API_BASE=/api
VITE_WS_BASE=/ws
EOF

# 装依赖 + 编译
npm ci
npm run build
```

产物在 `dist/`,把整个目录丢到 nginx 的 root 即可。

## 5. Nginx 配置

`/etc/nginx/conf.d/edu-coding.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # 前端
    root /opt/edu-coding-platform/frontend/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 反代
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket 反代
    location /ws/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
    }
}
```

HTTPS 证书用 Let's Encrypt:
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

## 6. 验证

1. 浏览器打开 `https://yourdomain.com` → 看到登录页
2. 用 demo 教师账号登录 → 进入后台
3. 进编辑器 → 写 `print("hello")` → 运行 → 看到 `hello`

## 7. 备份

- MongoDB:用 `mongodump` 每天凌晨备份到对象存储
- 课程资料:存在 MongoDB 里,备份 MongoDB 即可

## 8. 监控

- 后端:`pm2 monit` 看进程;接 Prometheus / Grafana 看指标
- Nginx:看 access log
- 前端:Sentry / 友盟 统计前端错误

## 9. 升级

```bash
cd /opt/edu-coding-platform
git pull
cd backend && npm ci --production && npm run build && pm2 restart edu-backend
cd ../frontend && npm ci && npm run build
```
