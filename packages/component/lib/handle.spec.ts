import { handle, getComponentHandlers } from './handle';

describe('handle', () => {
  it('should return an empy object by default', () => {
    class MyComponent {}

    expect(getComponentHandlers(MyComponent)).toEqual([]);
  });

  it('should add methods to the handlers map', () => {
    class MyComponent {
      @handle('foo') onFoo() {}
      @handle('bar') onBar() {}
    }

    expect(getComponentHandlers(MyComponent)).toEqual([
      { pattern: 'foo', key: 'onFoo' },
      { pattern: 'bar', key: 'onBar' },
    ]);
  });
});
