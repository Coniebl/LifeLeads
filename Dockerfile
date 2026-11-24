FROM node:24-alpine
WORKDIR /app

# 1. Copy package files
COPY package*.json ./

# 2. Install dependencies
RUN npm install

# 3. Copy the rest of the project files
COPY . .

# 4. Build the Next.js application
RUN npm run build

# 6. Expose the port so we can access it
EXPOSE 3000

# 7. Start the server!
CMD ["npm", "start"]
