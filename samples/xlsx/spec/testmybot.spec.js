
var timeout = 60000

const setupTestCases = () => {
  return new Promise((resolve) => {
    
    it('should be async testcase', (testcaseDone) => {
      console.log('in first testcase')
      expect('1').toContain('1')
      testcaseDone()
    }, timeout)
    
    it('should be another async testcase', (testcaseDone) => {
      console.log('in first testcase')
      expect('1').toContain('1')
      testcaseDone()
    }, timeout)
    
    resolve()
  })
}

const setupTestSuite = () => {
  return new Promise((resolve) => {
    describe('TestMyBot Test Suite', () => {
      beforeAll((done) => {
        done()
      }, timeout)

      beforeEach((done) => {
        done()
      }, timeout)

      afterEach((done) => {
        done()
      }, timeout)

      afterAll((done) => {
        done()
      }, timeout)

      setTimeout(() => setupTestCases().then(resolve), 5000)
    })
  })
}

setupTestSuite();
