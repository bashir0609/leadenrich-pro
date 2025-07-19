1 action at a time
testing need to be done using docker
do not write full page code without asking me
check existing code first using docker command


confirm the exact container name first
$ docker ps
CONTAINER ID   IMAGE                     COMMAND                  CREATED
   STATUS                    PORTS                                         NAMES
02cbafdbdfa9   leadenrich-pro-frontend   "docker-entrypoint.s…"   19 minutes ago
   Up 19 minutes             0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp   leade
nrich_frontend
7341bac32129   leadenrich-pro-backend    "docker-entrypoint.s…"   31 minutes ago
   Up 5 minutes              0.0.0.0:3001->3001/tcp, [::]:3001->3001/tcp   leade
nrich_backend
ff9950d58ad1   postgres:15-alpine        "docker-entrypoint.s…"   31 minutes ago
   Up 31 minutes (healthy)   0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp   leade
nrich_postgres
4e5499fc15c9   redis:7-alpine            "docker-entrypoint.s…"   31 minutes ago
   Up 31 minutes (healthy)   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp   leade
nrich_redis

$ docker exec leadenrich_backend ls -la
total 344
drwxr-xr-x    1 nodejs   nodejs        4096 Jul 18 15:19 .
drwxr-xr-x    1 root     root          4096 Jul 18 15:19 ..
drwxr-xr-x    1 nodejs   nodejs        4096 Jul 18 15:14 dist
drwxr-xr-x    2 nodejs   nogroup       4096 Jul 18 15:19 logs
drwxr-xr-x    1 nodejs   nodejs       20480 Jul 18 15:16 node_modules
-rwxr-xr-x    1 nodejs   nodejs      296309 Jul 18 15:16 package-lock.json
-rwxr-xr-x    1 nodejs   nodejs        2372 Jul 18 15:16 package.json
drwxr-xr-x    1 nodejs   nodejs        4096 Jul 18 08:36 prisma
drwxr-xr-x    1 nodejs   nodejs        4096 Jul 18 10:52 scripts
drwxr-xr-x    2 nodejs   nogroup       4096 Jul 18 15:19 uploads


