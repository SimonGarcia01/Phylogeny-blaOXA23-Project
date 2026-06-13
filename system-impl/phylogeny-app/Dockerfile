FROM node:20-slim

WORKDIR /app

# Copy both lockfiles — npm ci uses package-lock.json
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Use npx to access the locally installed nest CLI
RUN npx nest build

EXPOSE 3001

CMD ["node", "dist/main"]