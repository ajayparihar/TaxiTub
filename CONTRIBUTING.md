# Contributing to TaxiTub

We love your input! We want to make contributing to TaxiTub as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## 🚀 Development Process

We use GitHub to host code, track issues and feature requests, and accept pull requests.

### 1. Fork & Clone
```bash
# Fork the repository on GitHub, then:
git clone https://github.com/your-username/Delhi-Cabs.git
cd Delhi-Cabs

# Add upstream remote
git remote add upstream https://github.com/original-owner/Delhi-Cabs.git
```

### 2. Set Up Development Environment
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### 3. Create a Branch
```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 4. Make Changes
- Write code following our coding standards
- Add tests for new functionality
- Update documentation as needed
- Test your changes thoroughly

### 5. Commit & Push
```bash
# Stage your changes
git add .

# Commit with a clear message
git commit -m "feat: add optimized queue allocation algorithm"

# Push to your fork
git push origin feature/your-feature-name
```

### 6. Create Pull Request
- Open a pull request from your fork to the main repository
- Fill out the PR template completely
- Link any related issues

## 📝 Coding Standards

### TypeScript Guidelines
- Use strict TypeScript with all type checking enabled
- Define interfaces for all data structures
- Use meaningful variable and function names
- Add JSDoc comments for functions and classes

### Code Style
```typescript
// ✅ Good
interface CarInfo {
  carId: string;
  plateNo: string;
  driverName: string;
  seater: 4 | 5 | 6 | 7 | 8;
}

const assignTaxi = async (passengerCount: number): Promise<ApiResponse<CarInfo>> => {
  // Implementation with clear error handling
};

// ❌ Avoid
const assign = async (count) => {
  // Implementation
};
```

### File Structure
```
src/
├── components/          # React components
├── pages/              # Page components  
├── services/           # Business logic
├── types/              # TypeScript interfaces
├── config/             # Configuration files
├── hooks/              # Custom React hooks
└── utils/              # Utility functions
```

### Version Headers
All files should include version headers:
```typescript
// TaxiTub Module: Component Name
// Version: v0.1.0
// Last Updated: 2025-01-XX
// Author: Your Name
// Changelog: Description of changes
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- QueueService.test.ts

# Run tests in watch mode
npm test -- --watch
```

### Writing Tests
- Write unit tests for all service functions
- Test error conditions and edge cases
- Test FIFO queue integrity
- Include integration tests for user workflows

Example test structure:
```typescript
describe('QueueService', () => {
  describe('addCarToQueue', () => {
    it('should add car to appropriate queue', async () => {
      // Arrange
      const carId = 'test-car-id';
      
      // Act
      const result = await QueueService.addCarToQueue({ carId });
      
      // Assert
      expect(result.success).toBe(true);
    });
  });
});
```

## 🎯 Areas for Contribution

### 🐛 Bug Fixes
- Check existing issues for bugs to fix
- Include reproduction steps in your PR
- Add tests to prevent regression

### ✨ New Features
- Discuss major features in issues first
- Break large features into smaller PRs
- Update documentation for new features

### 📚 Documentation
- Fix typos and improve clarity
- Add code examples
- Update API documentation
- Create tutorials and guides

### 🎨 UI/UX Improvements
- Follow Material-UI design guidelines
- Ensure mobile responsiveness
- Maintain accessibility standards (WCAG 2.1)
- Test across different devices and browsers

### ⚡ Performance
- Database query optimization
- Bundle size reduction
- Component rendering optimization
- Error handling improvements

## 📋 Pull Request Process

### PR Checklist
- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Responsive design verified
- [ ] Accessibility tested
- [ ] PR description is clear and complete

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
```

## 🔍 Code Review Process

### For Contributors
- Respond to review feedback promptly
- Make requested changes in new commits
- Ask questions if feedback is unclear
- Keep PRs focused and reasonably sized

### For Reviewers
- Be constructive and respectful
- Focus on code quality and maintainability
- Check for proper error handling
- Verify tests are comprehensive

## 🚨 Issue Reporting

### Bug Reports
Use the bug report template and include:
- **Environment**: OS, browser, Node.js version
- **Steps to reproduce**: Clear, numbered steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Console errors**: Any error messages

### Feature Requests
- Check if the feature already exists or was requested
- Describe the problem you're trying to solve
- Propose a solution if you have one
- Consider the impact on existing functionality

## 🎖️ Recognition

Contributors who make significant contributions will be:
- Listed in the project README
- Mentioned in release notes
- Invited to join the maintainer team (for consistent contributors)

## 📞 Getting Help

- **GitHub Discussions**: For questions and general discussion
- **Issues**: For bugs and feature requests
- **Email**: For urgent matters or security issues

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to TaxiTub! 🚖✨
