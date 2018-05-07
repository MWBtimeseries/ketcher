function Fragment(flag = null) {
	this.stereoAtoms = {
		abs: new Map(), // key: aid, value: number of stereo setting
		and: new Map(),
		or: new Map()
	};
	this.enhancedStereoFlag = flag; // can be [null, 'ABS'(Chiral), 'AND', 'OR', 'Mixed']
}
Fragment.prototype = Object.create(null);

Fragment.prototype.updateStereoFlag = function (flag) {
	if (arguments.length > 0) {
		this.enhancedStereoFlag = flag;
		return;
	}

	const absSize = new Set(this.stereoAtoms.abs.values()).size;
	const andSize = new Set(this.stereoAtoms.and.values()).size;
	const orSize = new Set(this.stereoAtoms.or.values()).size;

	if (absSize > 0)
		this.enhancedStereoFlag = (absSize === 1 && andSize === 0 && orSize === 0) ? 'ABS' : 'Mixed';
	else if (andSize > 0)
		this.enhancedStereoFlag = (andSize === 1 && absSize === 0 && orSize === 0) ? 'AND' : 'Mixed';
	else if (orSize > 0)
		this.enhancedStereoFlag = (orSize === 1 && andSize === 0 && absSize === 0) ? 'OR' : 'Mixed';
	else
		this.enhancedStereoFlag = null;
};

Fragment.prototype.updateStereoAtom = function (aid, stereoLabel) {
	const { type, number = 0 } = stereoLabel;

	if (type) this.stereoAtoms[type].set(aid, number);

	if (type !== 'abs' && this.stereoAtoms.abs.has(aid)) this.stereoAtoms.abs.delete(aid);
	if (type !== 'and' && this.stereoAtoms.and.has(aid)) this.stereoAtoms.and.delete(aid);
	if (type !== 'or' && this.stereoAtoms.or.has(aid)) this.stereoAtoms.or.delete(aid);

	this.updateStereoFlag();
};

Fragment.prototype.getStereoCollections = function () {
	const stereoCollections = {};

	Object.keys(this.stereoAtoms).forEach((type) => {
		const col = this.stereoAtoms[type];
		if (col.size === 0) return;
		stereoCollections[type] = new Map();
		this.stereoAtoms[type].forEach((number, aid) => {
			if (!stereoCollections[type].has(number))
				stereoCollections[type].set(number, [aid]);
			else
				stereoCollections[type].get(number).push(aid);
		});
	});

	return stereoCollections;
};

Fragment.prototype.clone = function (aidMap) {
	const fr = new Fragment(this.enhancedStereoFlag);

	Object.keys(this.stereoAtoms).forEach((type) => {
		const atoms = this.stereoAtoms[type];
		atoms.forEach((stereoNumber, aid) => {
			fr.stereoAtoms[type].set(aidMap.get(aid), stereoNumber);
		});
	});

	return fr;
};

export default Fragment;
