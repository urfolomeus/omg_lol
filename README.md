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

| command | description |
|:--|:---|
| <nowrap valign="top">`./bin/omglol blog status`</nowrap> | Check your blogging status:<br>&nbsp;&nbsp;Total = number of posts published<br>&nbsp;&nbsp;Days = number of days since your first post<br>&nbsp;&nbsp;Delta = delta between posts and days (positive means you're ahead, negative means you're behind) |
| <nowrap valign="top">`./bin/omglol blog timeline`</nowrap> | Display a timeline of blog post counts by day since the first post, highlighting days with no posts. |

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

- `API_URL`: URL for your omg.lol API
- `API_TOKEN`: your [omg.lol API token](https://home.omg.lol/account)

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
