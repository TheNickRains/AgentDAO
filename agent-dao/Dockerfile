FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Copy app source
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose ports
EXPOSE 3000
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/index.js"] 