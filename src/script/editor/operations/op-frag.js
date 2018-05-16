import Vec2 from '../../util/vec2';
import { Fragment } from '../../chem/struct';
import { ReFrag, ReEnhancedFlag } from '../../render/restruct';

import Base, { invalidateItem } from './base';

function FragmentAdd(frid) {
	this.frid = (typeof frid === 'undefined') ? null : frid;

	this.execute = function (restruct) {
		const struct = restruct.molecule;
		const frag = new Fragment();

		if (this.frid === null)
			this.frid = struct.frags.add(frag);
		else
			struct.frags.set(this.frid, frag);

		restruct.frags.set(this.frid, new ReFrag(frag)); // TODO add ReStruct.notifyFragmentAdded
		restruct.enhancedFlags.set(this.frid, new ReEnhancedFlag(null, null));
	};

	this.invert = function () {
		return new FragmentDelete(this.frid);
	};
}
FragmentAdd.prototype = new Base();

function FragmentDelete(frid) {
	this.frid = frid;

	this.execute = function (restruct) {
		const struct = restruct.molecule;
		invalidateItem(restruct, 'frags', this.frid, 1);
		restruct.frags.delete(this.frid);
		struct.frags.delete(this.frid); // TODO add ReStruct.notifyFragmentRemoved

		restruct.clearVisel(restruct.enhancedFlags.get(frid).visel);
		restruct.enhancedFlags.delete(frid);
	};

	this.invert = function () {
		return new FragmentAdd(this.frid);
	};
}
FragmentDelete.prototype = new Base();

function StereoAtomFrag(oldfrid, newfrid, aid) {
	this.data = { oldfrid, newfrid, aid };
	this.data2 = null;

	this.execute = function (restruct) {
		const struct = restruct.molecule;

		if (!this.data2) {
			this.data2 = {
				oldfrid: this.data.newfrid,
				newfrid: this.data.oldfrid,
				aid: this.data.aid
			};
		}
		const oldfrag = struct.frags.get(this.data.oldfrid);
		const stereoMark = oldfrag.getStereoAtomMark(this.data.aid);
		if (stereoMark.type === null) return;

		const newfrag = struct.frags.get(this.data.newfrid);
		oldfrag.updateStereoAtom(this.data.aid, { type: null });
		newfrag.updateStereoAtom(this.data.aid, stereoMark);

		// console.log(oldfrag, newfrag)

		restruct.enhancedFlags.get(this.data.oldfrid).flag = oldfrag.enhancedStereoFlag;
		restruct.enhancedFlags.get(this.data.newfrid).flag = newfrag.enhancedStereoFlag;
	};

	this.invert = function () {
		const ret = new StereoAtomFrag();
		ret.data = this.data2;
		ret.data2 = this.data;
		return ret;
	};
}
StereoAtomFrag.prototype = new Base();

function StereoAtomMark(aid, stereoMark) {
	this.data = { aid, stereoMark };
	this.data2 = null;

	this.execute = function (restruct) {
		const struct = restruct.molecule;
		const frid = struct.atoms.get(this.data.aid).fragment;
		const frag = struct.frags.get(frid);

		if (!this.data2) {
			this.data2 = {
				aid: this.data.aid,
				stereoMark: frag.getStereoAtomMark(this.data.aid)
			};
		}
		frag.updateStereoAtom(this.data.aid, this.data.stereoMark);

		markEnhancedFlag(restruct, frid, frag.enhancedStereoFlag);
	};

	this.invert = function () {
		const ret = new StereoAtomMark();
		ret.data = this.data2;
		ret.data2 = this.data;
		return ret;
	};
}
StereoAtomMark.prototype = new Base();

function EnhancedFlagMove(frid, p) {
	this.data = { frid, p };

	this.execute = function (restruct) {
		if (!this.data.p) {
			const bb = restruct.molecule.getFragment(this.data.frid).getCoordBoundingBox();
			this.data.p = new Vec2(bb.max.x, bb.min.y - 1);
		}
		restruct.enhancedFlags.get(this.data.frid).pp = this.data.p;
		invalidateItem(restruct, 'enhancedFlags', this.data.frid, 1);
	};

	this.invert = function () {
		const ret = new EnhancedFlagMove();
		ret.data = this.data;
		return ret;
	};
}
EnhancedFlagMove.prototype = new Base();

// TODO: remove ?
function markEnhancedFlag(restruct, frid, flag) {
	const reEnhancedFlag = restruct.enhancedFlags.get(frid);
	restruct.clearVisel(reEnhancedFlag.visel);
	const bb = restruct.molecule.getFragment(frid).getCoordBoundingBox();
	reEnhancedFlag.flag = flag;
	reEnhancedFlag.pp = new Vec2(bb.max.x, bb.min.y - 1);

	restruct.markItem('enhancedFlags', frid, 1);
}

export {
	FragmentAdd,
	FragmentDelete,
	StereoAtomFrag,
	StereoAtomMark,
	EnhancedFlagMove
};
