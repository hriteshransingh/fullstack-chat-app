// service/peer.js
class PeerService {
  constructor() {
    this.peer = null;
  }

  async initPeer() {
    if (!this.peer) {
      console.log("Creating new RTCPeerConnection");
      this.peer = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });
    }
    return this.peer;
  }

  async getOffer() {
    if (!this.peer) await this.initPeer();
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    return offer;
  }

  async getAnswer(offer) {
    if (!this.peer) await this.initPeer();
    await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
    console.log("Remote description set from offer");
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);
    console.log("Answer created and set as local description");
    return answer;
  }

  async setLocalDescription(answer) {
    if (!this.peer) await this.initPeer();
    await this.peer.setRemoteDescription(new RTCSessionDescription(answer));
    console.log("Remote description set from answer");
  }
}

export default new PeerService();