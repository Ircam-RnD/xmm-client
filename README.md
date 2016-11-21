# xmm-client
### XMM models decoders for the browser

This library is intended to be used with the
[original XMM library](https://github.com/Ircam-RnD/xmm), or its Node.js wrapper
[xmm-node](https://github.com/Ircam-RnD/xmm-node), which takes care of turning phrases
and training sets into statistical models, besides allowing to do exactly the same
things as xmm-client, server-side.

It contains 4 classes :
- PhraseMaker, which eases the creation of XMM-compatible phrases
(e.g. time series recordings of dimension n), that can then be passed to XMM.
- SetMaker, which eases the management of training sets, aka collections of Phrases.
A SetMaker should only contain phrases with the same configuration (bimodality, dimension,
input dimension, etc), only labels and lengths may vary. Training sets can also
be passed to XMM directly to generate a corresponding GMM or HHMM model.
- GmmDecoder, which takes a GMM model generated by XMM and outputs
some estimation results when it's fed with an input vector
- HhmmDecoder, which does the same with a Hierarchical HMM model generated by XMM.

#### installation :

`npm install [--save] Ircam-RnD/xmm-client`

#### es6 example :

```JavaScript
import { PhraseMaker, HhmmDecoder } from 'xmm-client';
const phraseMaker = new PhraseMaker({
	column_names: ['gyrAlpha', 'gyrBeta', 'gyrGamma'],
	label: 'someGesture'
});

const hhmmDecoder = new HhmmDecoder();
```

#### credits :

This library is developed by the [ISMM](http://ismm.ircam.fr/) team at IRCAM,
within the context of the [RAPID-MIX](http://rapidmix.goldsmithsdigital.com/)
project, funded by the European Union’s Horizon 2020 research and innovation programme.  
Original XMM code authored by Jules Françoise, ported to JavaScript by Joseph Larralde.  
See [github.com/Ircam-RnD/xmm](https://github.com/Ircam-RnD/xmm) for detailed XMM credits.