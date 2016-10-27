
class SetMaker {
  constructor(options = {}) {
    // options could be :
    // formattingMode: [ 'auto', 'manual' ]
    // ==> in auto mode, the dimensions and column names are guessed from the first added phrase
    // ==> in manual mode, they must be given explicitly.

    this._bimodal = this.params.bimodal;
    this._dimension = this.params.dimension;
    this._dimensionInput = this.params.dimensionInput;
    this._columnNames = this.params.columnNames;
  }

  /**
   * Add an xmm phrase to the current set.
   */
  addPhrase(phrase) {

  }

  /**
   * Get phrase at a particular index.
   */
  getPhrase(index) {

  }

  /**
   * Remove phrase at a particular index.
   */
  removePhrase(index) {

  }

  /**
   * Return the subset of phrases of a particular label.
   */
  getPhrasesOfLabel(label) {

  }

  /**
   * Remove all phrases of a particular label
   */
  removePhrasesOfLabel(label) {

  }

  /**
   * Add all phrases from another training set.
   */
  addTrainingSet(set) {

  }

  /**
   * Return the current training set.
   */
  getTrainingSet() {

  }

  /**
   * Clear the whole set.
   */
  clear() {

  }

  /** @private */
  _checkIntegrity(phrase) {

  }
}