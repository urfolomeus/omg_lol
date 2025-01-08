# omglol-cli

A command-line interface for interacting with omg.lol services.

## Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/urfolomeus/omglol-cli.git
   cd omglol-cli
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Copy the environment file and configure your settings:

   ```
   cp .envrc.example .envrc
   ```

   Edit `.envrc` with your omg.lol settings.

## Building

To build the project:

   ```
   npm run build
   ```

This will compile the TypeScript files into JavaScript in the `dist` directory.

## Usage

The CLI supports various commands for interacting with omg.lol services.

Before first use, make the CLI script executable:

   ```
   chmod +x bin/omglol
   ```

### Blog Commands

Count the number of posts in your blog:

   ```
   ./bin/omglol blog count
   ```

Display a timeline of blog post counts by day:

   ```
   ./bin/omglol blog timeline
   ```

This command shows the number of posts published each day since the first post, including days with no posts.

## Development

### Running Tests

Run the test suite (starts in watch mode by default):

   ```
   npm test
   ```

To run tests once without watch mode:

   ```
   npm test -- --run
   ```

### Environment Variables

- `BLOG_FEED_URL`: URL to your omg.lol blog's JSON feed (required for blog commands)

## Project Structure

   ```
   .
   ├── bin/           # CLI executables
   ├── src/           # Source code
   │   ├── blog.ts    # Blog-related commands
   │   └── *.test.ts  # Test files
   ├── dist/          # Compiled JavaScript (generated)
   └── package.json   # Project configuration
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
