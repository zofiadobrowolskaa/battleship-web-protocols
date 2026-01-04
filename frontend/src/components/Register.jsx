import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import API from '../api/axios';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation(); // hook to access the current location state

  // define Yup validation schema for form inputs
  const validationSchema = Yup.object({
    username: Yup.string()
      .min(3, 'Username must be at least 3 characters')
      .required('Required'),
    email: Yup.string()
      .required('Required')
      .matches(/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/, 'Invalid email format'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Required'),
  });

  // initialize Formik with initial values, validation and submit handler
  const formik = useFormik({
    initialValues: {
      username: '',
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        // send POST request to register endpoint with form values
        await API.post('/auth/register', values);
        toast.success('Registered! Please login 🚢');
        navigate('/login', { state: { from: location.state?.from } });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Registration failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <form className="auth-container" onSubmit={formik.handleSubmit}>
      <h2>Register</h2>

      <input
        name="username"
        type="text"
        placeholder="Username"
        className={formik.touched.username && formik.errors.username ? 'error-input' : ''}
        {...formik.getFieldProps('username')} // bind Formik handlers and values
      />
      {formik.touched.username && formik.errors.username ? (
        <div className="error-message">{formik.errors.username}</div>
      ) : null}

      <input
        name="email"
        type="text"
        placeholder="Email"
        className={formik.touched.email && formik.errors.email ? 'error-input' : ''}
        {...formik.getFieldProps('email')}
      />
      {formik.touched.email && formik.errors.email ? (
        <div className="error-message">{formik.errors.email}</div>
      ) : null}

      <input
        name="password"
        type="password"
        placeholder="Password"
        className={formik.touched.password && formik.errors.password ? 'error-input' : ''}
        {...formik.getFieldProps('password')}
      />
      {formik.touched.password && formik.errors.password ? (
        <div className="error-message">{formik.errors.password}</div>
      ) : null}

      <button type="submit" disabled={formik.isSubmitting}>
        {formik.isSubmitting ? 'Registering...' : 'Register'}
      </button>

      <p className="auth-switch">
        Already have an account? 
        <Link to="/login" state={{ from: location.state?.from }}> Login here</Link>
      </p>
    </form>
  );
};

export default Register;
