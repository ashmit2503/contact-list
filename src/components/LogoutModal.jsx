import Modal from './Modal'

export default function LogoutModal({ show, onConfirm, onCancel }) {
  return (
    <Modal show={show} onClose={onCancel}>
      <div className="modal-header">
        <h3>Confirm Logout</h3>
      </div>
      <div className="modal-body">
        <p>Are you sure you want to logout?</p>
      </div>
      <div className="modal-footer">
        <button onClick={onCancel} className="btn-cancel">
          Cancel
        </button>
        <button onClick={onConfirm} className="btn-logout">
          Logout
        </button>
      </div>
    </Modal>
  )
}
