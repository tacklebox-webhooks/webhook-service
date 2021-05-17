class InvalidArgumentError extends Error {
  constructor(message) {
    super(message);
    Object.setPrototypeOf(this, InvalidArgumentError.prototype);
    this.name = "InvalidArgumentError";
  }
}

module.exports = {
  InvalidArgumentError,
};
