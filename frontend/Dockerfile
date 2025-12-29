# Build stage
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install

ARG VITE_HA_URL
ARG VITE_HA_TOKEN

COPY . .
RUN VITE_HA_URL=$VITE_HA_URL VITE_HA_TOKEN=$VITE_HA_TOKEN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Custom nginx config to handle SPA routing if necessary
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
