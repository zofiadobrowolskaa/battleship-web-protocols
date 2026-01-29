import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import API from '../api/axios';

const Profile = ({ onLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  const validationSchema = Yup.object({
    username: Yup.string().min(3, 'Username must be at least 3 characters').required('Required'),
    email: Yup.string().required('Required').matches(/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/, 'Invalid email format'),
  });

  const formik = useFormik({
    initialValues: { username: '', email: '' },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await API.put('/users/profile', values);
        sessionStorage.setItem('username', values.username);
        toast.success('Profile updated!');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Update failed');
      }
    },
  });

  useEffect(() => {
    API.get('/users/profile')
      .then(res => {
        formik.setValues({ username: res.data.username, email: res.data.email });
        setLoading(false);
      })
      .catch(() => toast.error('Failed to load profile'));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="auth-container profile-page">
      <h2>Your Profile</h2>
      <form onSubmit={formik.handleSubmit}>
        <input name="username" {...formik.getFieldProps('username')} placeholder="Username" />
        {formik.touched.username && formik.errors.username && <div className="error-message">{formik.errors.username}</div>}
        
        <input name="email" {...formik.getFieldProps('email')} placeholder="Email" />
        {formik.touched.email && formik.errors.email && <div className="error-message">{formik.errors.email}</div>}

        <button type="submit" className="update-btn">Update Profile</button>
      </form>
      
      <div className="profile-actions">
        {!showConfirm ? (
          <button 
            type="button" 
            className="delete-btn" 
            onClick={() => setShowConfirm(true)}
          >
            Delete Account
          </button>
        ) : (
          <div className="confirm-group">
            <p>Are you sure?</p>
            <div className="confirm-btns">
                <button 
                  type="button" 
                  className="delete-btn-confirm" 
                  onClick={async () => {
                    try {
                      await API.delete('/users/profile');
                      toast.success('Account deleted');
                      onLogout();
                    } catch (err) {
                      toast.error('Deletion failed');
                      setShowConfirm(false);
                    }
                  }}
                >
                  Yes, Delete
                </button>
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;