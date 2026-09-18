FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
# Force install ALL dependencies (including dev) so Vite and Tailwind exist even if NODE_ENV=production
RUN npm install --include=dev
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
