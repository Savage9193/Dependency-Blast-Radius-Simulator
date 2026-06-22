import '@testing-library/jest-dom';

HTMLDialogElement.prototype.showModal = jest.fn(function (this: HTMLDialogElement) {
  this.open = true;
});

HTMLDialogElement.prototype.close = jest.fn(function (this: HTMLDialogElement) {
  this.open = false;
});
